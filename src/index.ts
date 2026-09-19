/**
 * @file index.ts
 * @description Entry point — basic usage example of {@link HashMap}.
 */

import { HashMap } from './data-structure/hash-table.ds.ts'
import { TUser } from './types/user.type.ts'

const userDb = new HashMap<string, TUser>()

userDb.add('u-001', { id: 'u-001', name: 'Luis', age: 30, genre: 'MALE', createdAt: new Date() })
