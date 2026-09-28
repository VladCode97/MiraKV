import { BINARY_FORMAT } from "../../domain/constants/binary-types.constant";
import { FILE_OPERATIONS } from "../../domain/constants/file-operations.constant";
import { ISerializer } from "../../domain/interfaces/serializar.interface";
import { TRecordLocation } from "../../domain/types/page.type";
import { AVLTree } from "../../index/AVL/avl-tree.ds";
import { pageIdAllocatorUtil } from "../../utils/page.util";
import { open, readFile, FileHandle } from "node:fs/promises";
/**
 * Manages the lifecycle and physical layout of pages in MiraKV.
 * A page is a fixed-size binary buffer used to store records and
 * the metadata required to locate them.
 */
export class PageManager {
  private readonly PAGE_SIZE_BYTES: number; // 16 KiB
  private readonly SLOT_SIZE: number;
  private recordStart!: number;
  private slotEnd!: number;
  private pageBuffer!: Buffer;
  private readonly ROUTE_FILE: string;
  private fileHandler!: FileHandle;

  /**
   * Creates a PageManager using the provided serializer to convert
   * records into their binary representation.
   * @param serializer Serializer used to encode records before storing them.
   */
  constructor(
    private readonly serializer: ISerializer,
    private readonly indexAVL: AVLTree<string, TRecordLocation>,
  ) {
    this.PAGE_SIZE_BYTES = 16 * 1024;
    this.SLOT_SIZE = 9;
    this.ROUTE_FILE = "./data/mira.mkv";
    this.createPage();
  }

  /**
   * Opens the storage file for reading and writing.
   *
   * Uses `w+`, which creates the file if it does not exist and truncates
   * it to zero length if it does. Pages are written by absolute position
   * (`pageId * PAGE_SIZE_BYTES`), so each run starts from a clean file.
   *
   * Must be awaited before any call to {@link appendRecord} or
   * {@link findId}.
   *
   * @returns A promise that resolves once the file handle is ready.
   */
  public async initialize(): Promise<void> {
    this.fileHandler = await open(this.ROUTE_FILE, FILE_OPERATIONS.WRITE_READ);
  }

  public async close(): Promise<void> {
    await this.persistPage();
    await this.fileHandler.close();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Serializes a record and prepares its binary representation
   * for insertion into a page.
   * @param record Record to serialize.
   */
  public async appendRecord(record: unknown, key: string): Promise<void> {
    const recordSerialized = this.serializer.serialize(record);
    const newSlotEnd = this.slotEnd + this.SLOT_SIZE;
    const newRecordStart = this.recordStart - recordSerialized.byteLength;
    if (newSlotEnd > newRecordStart) {
      await this.persistPage();
      this.createPage();
    }
    const { offset, length } = this.allocateRecord(
      recordSerialized,
      recordSerialized.byteLength,
    );
    const slotId = (this.slotEnd - 9) / this.SLOT_SIZE;
    this.allocateSlot(slotId, offset, length);
    this.updateSlotCount();
    const header = this.pageBuffer.subarray(0, 9);
    this.indexAVL.append(key, {
      pageId: header.readUInt32LE(1),
      slotId: slotId,
    });
  }

  /**
   * Locates and deserializes a record by its index key.
   *
   * Lookup follows three steps:
   * 1. The {@link AVLTree} index is consulted to resolve the key into a
   *    `pageId` and `slotId`.
   * 2. The storage file is read and the target page is extracted using
   *    `pageId * PAGE_SIZE_BYTES` as the byte offset.
   * 3. The slot at `9 + slotId * SLOT_SIZE` is read to obtain the record's
   *    physical `offset` and `length` within the page. The record bytes are
   *    then deserialized through the configured {@link ISerializer}.
   *
   * Returns an empty object when the key is not present in the index.
   *
   * @param key - The index key to look up.
   * @returns A promise that resolves to the deserialized record, or `{}`
   *          if the key does not exist.
   */
  public async findId(key: string): Promise<unknown> {
    const file = await readFile(this.ROUTE_FILE);
    const element = this.indexAVL.search(key);
    if (element === null) {
      return {};
    }
    const { pageId, slotId } = element.value;
    const pageOffset = pageId * this.PAGE_SIZE_BYTES;
    const page = file.subarray(pageOffset, pageOffset + this.PAGE_SIZE_BYTES);
    const slotOffset = 9 + slotId * this.SLOT_SIZE;
    const slot = page.subarray(slotOffset, slotOffset + this.SLOT_SIZE);
    const offset = slot.readUInt32LE(1);
    const length = slot.readUInt32LE(5);
    const record = page.subarray(offset, offset + length);
    return this.serializer.deserialize(record);
  }

  /**
   * Returns the current page managed by the PageManager.
   * @returns The current page, or undefined if no page is available.
   */
  public async getPage(): Promise<unknown[] | undefined> {
    const file = await readFile(this.ROUTE_FILE);
    const header = file.subarray(0, 9);
    const slotCount = header.readUInt32LE(5);
    const records = [];
    for (let i: number = 0; i < slotCount; i++) {
      const slotStart = 9 + i * this.SLOT_SIZE;
      const slotEnd = slotStart + this.SLOT_SIZE;
      const slot = file.subarray(slotStart, slotEnd);
      const offset = slot.readUInt32LE(1);
      const length = slot.readUInt32LE(5);
      const record = file.subarray(offset, offset + length);
      records.push(this.serializer.deserialize(record));
    }
    return records;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Creates a new empty page with the configured page size.
   * Initializes the page header with a unique page identifier
   * and an empty slot count.
   */
  private createPage(): void {
    this.pageBuffer = Buffer.alloc(this.PAGE_SIZE_BYTES);
    this.recordStart = this.PAGE_SIZE_BYTES;
    this.slotEnd = 9;
    const header = this.pageBuffer.subarray(0, 9);
    header.writeUInt8(BINARY_FORMAT.VERSION, 0);
    header.writeUInt32LE(pageIdAllocatorUtil(), 1);
    header.writeUInt32LE(0, 5);
  }

  /**
   * Allocates space for a slot within the current page.
   * Stores the slot identifier and the physical location
   * of the corresponding record.
   * @param slotId Identifier of the slot.
   * @param offset Byte offset where the record starts within the page.
   * @param length Number of bytes occupied by the record.
   */
  private allocateSlot(slotId: number, offset: number, length: number): void {
    const slotStart = this.slotEnd;
    const slotEnd = slotStart + this.SLOT_SIZE;
    const slot = this.pageBuffer.subarray(slotStart, slotEnd);
    slot.writeUInt8(slotId, 0);
    slot.writeUInt32LE(offset, 1);
    slot.writeUInt32LE(length, 5);
    this.slotEnd = slotEnd;
  }

  /**
   * Allocates space for a record within the current page.
   * Copies the serialized record into the allocated region
   * and returns its physical location.
   * @param record Serialized record to store.
   * @param recordLength Number of bytes occupied by the record.
   * @returns The offset and length of the allocated record.
   */
  private allocateRecord(
    record: Buffer,
    recordLength: number,
  ): {
    offset: number;
    length: number;
  } {
    const newRecordStart = this.recordStart - recordLength;
    const recordBuffer = this.pageBuffer.subarray(
      newRecordStart,
      this.recordStart,
    );
    record.copy(recordBuffer);
    this.recordStart = newRecordStart;
    return {
      offset: newRecordStart,
      length: recordLength,
    };
  }

  /**
   * Increments the number of slots stored in the current page.
   */
  private updateSlotCount(): void {
    const header = this.pageBuffer.subarray(0, 9);
    const slotCounts = header.readUInt32LE(5);
    header.writeUInt32LE(slotCounts + 1, 5);
  }

  /**
   * Persists the current page by appending its binary representation
   * to the storage file.
   *
   * @returns A promise that resolves when the page has been persisted.
   */
  private async persistPage(): Promise<void> {
    const header = this.pageBuffer.subarray(0, 9);
    const pageId = header.readInt32LE(1);
    const position = pageId * this.PAGE_SIZE_BYTES;
    await this.fileHandler.write(
      this.pageBuffer,
      0,
      this.pageBuffer.byteLength,
      position,
    );
  }
}
