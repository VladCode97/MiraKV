import { ISerializer } from "../../domain/interfaces/serializar.interface";
import { TPage } from "../../domain/types/page.type";
import pageIdAllocatorUtil from "../../utils/page.util";

/**
 * Manages the lifecycle and physical layout of pages in MiraKV.
 * A page is a fixed-size binary buffer used to store records and
 * the metadata required to locate them.
 */
export class PageManager {
  private readonly PAGE_SIZE_BYTES: number; // 16 KiB
  private recordStart: number;

  /**
   * Creates a PageManager using the provided serializer to convert
   * records into their binary representation.
   * @param serializer Serializer used to encode records before storing them.
   */
  constructor(private readonly serializer: ISerializer) {
    this.PAGE_SIZE_BYTES = 16 * 1024;
    this.recordStart = this.PAGE_SIZE_BYTES;
  }

  /**
   * Creates a new empty page with the configured page size.
   * Initializes the page header with a unique page identifier
   * and an empty slot count.
   */
  createPage(): void {
    const pageBuffer = Buffer.alloc(this.PAGE_SIZE_BYTES);
    const header = pageBuffer.subarray(0, 12);
    const idPage: number = pageIdAllocatorUtil();
    const slots: number = 0;

    header.writeUInt32LE(idPage, 0);
    header.writeUInt32LE(slots, 4);
  }

  /**
   * Serializes a record and prepares its binary representation
   * for insertion into a page.
   * @param record Record to serialize.
   */
  public appendRecord(record: unknown): void {
    const recordSerialized = this.serializer.serialize(record);
    console.log(recordSerialized);
    console.log(`Length buffer ${recordSerialized.byteLength}`);
  }

  /**
   * Returns the current page managed by the PageManager.
   * @returns The current page, or undefined if no page is available.
   */
  public getPage(): TPage | undefined {
    return undefined;
  }

  /**
   * Returns the contiguous free space available for storing records
   * within the current page.
   * @returns Available free space in bytes.
   */
  private get FreeSpace(): number {
    return 0;
  }
}
