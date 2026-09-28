/**
 * @file user.type.ts
 * @description Type definition for the sample user record used across
 * MiraKV examples and benchmarks.
 */

/**
 * Supported countries for a user's location.
 * Values are the human-readable country names stored in the record.
 */
export enum ECountry {
  COL = "COLOMBIA",
  EEUU = "UNIT STATES",
  SPA = "SPAIN",
  BRA = "BRAZI",
  GER = "GERMANY",
}

/**
 * Supported cities for a user's location.
 * Values are the human-readable city names stored in the record.
 */
export enum ECities {
  CAL = "CALI",
  NY = "NEW YORK",
  BAR = "BARCELONA",
  SAP = "SAO PABLO",
  BER = "BERLIN",
}

/**
 * Location associated with a user, pairing a country with a city.
 * Used as a nested object within {@link TUser} to exercise the
 * object codec's nested-serialization support.
 */
export type TCountry = {
  /** Country where the user is located. */
  name: ECountry;
  /** City where the user is located. */
  city: ECities;
};

/**
 * Represents a user record stored in MiraKV.
 *
 * Used as a sample record type when exercising the storage engine —
 * inserting, indexing, and retrieving values through a {@link Collection}.
 *
 * @example
 * const user: TUser = {
 *   name: "Luis",
 *   doc: "89104952452",
 *   number: "+57 300 1234",
 *   description: "sample record",
 *   country: { name: ECountry.COL, city: ECities.CAL },
 *   createdAt: new Date(),
 * };
 */
export type TUser = {
  /** Display name of the user. */
  name: string;
  /** Unique document identifier, used as the index key. */
  doc: string;
  /** Contact phone number. */
  number: string;
  /** Free-form description associated with the user. */
  description: string;
  /** Nested location (country + city) of the user. */
  country: TCountry;
  /** Timestamp of when the record was created. */
  createdAt: Date;
  roles: string[];
};
