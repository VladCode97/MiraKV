# Page

A Page is a logical storage unit used to organize and manage data within a storage system.

The data is represented using a byte-based format composed of a layout that organizes information within the Page.

Each Page contains different components within this layout:

- **Header**
  - Represents metadata, or data about data. Its purpose is to provide auxiliary information about the Page that allows different operations to be performed on it.

- **Slots**
  - Represent the location of Records within the Page. Their location is determined using a concept called:
    - **Offset**
      - Represents a position measured in bytes from a specific reference point.
      - Together with a `length`, it determines the byte range occupied by a piece of data.

- **Free Space**
  - Represents the available space within the Page for storing new information.

- **Records**
  - Represent the data stored within the Page.
  - Records are stored from the end of the Page towards the beginning.

## Why Use Bytes?

A question arises from this model:

> Why use a byte-based representation instead of keeping data only as in-memory structures?

Keeping data exclusively in memory introduces several problems:

- What happens if the process or system shuts down?
- What happens when the amount of data exceeds the available memory?
- How can data remain available after restarting the system?

Data structures stored in memory are volatile. If information exists only in memory, shutting down the process or system can cause that state to be lost.

Therefore, a persistent storage system needs a representation capable of surviving the lifecycle of the process.

From this requirement, different concepts and mechanisms emerge for representing and persisting information in storage systems such as disks.

One of these logical units is the Page.

## Byte Representation

Using bytes is a design decision related to the binary representation of information.

Computers operate internally using bits, where each bit can represent either `0` or `1`.

A byte consists of 8 bits and is a fundamental unit for representing and manipulating binary information.

Therefore, when designing a low-level storage representation, information can be represented as a deterministic sequence of bytes.

This representation allows the system to:

- write data to a file;
- read it again;
- interpret specific positions as specific values;
- serialize and deserialize structures;
- define a binary layout for a Page.

A Page can therefore be understood as a logical structure whose physical representation can be expressed as a sequence of bytes.

# Page Layout

The layout represents how the different components are conceptually distributed within the available space of a Page.

Slots allow the system to locate Records stored in the data area.

Slots grow from the beginning of the Page towards the end, while Records grow from the end of the Page towards the beginning.

The space between both regions represents free space.

```text
┌──────────────────────────────┐
│ Header                       │
├──────────────────────────────┤
│ Slot 0                       │
│ Slot 1                       │
│ Slot 2                       │
│ ...                          │
├──────────────────────────────┤
│                              │
│         Free Space           │
│                              │
├──────────────────────────────┤
│ Record N                     │
│ Record N-1                   │
│ ...                          │
└──────────────────────────────┘
```

When the boundaries between Slots and Records meet, the Page no longer has enough space to store another Slot + Record combination.

At that point, storage must continue in another Page.
