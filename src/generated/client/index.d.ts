
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Registration
 * 
 */
export type Registration = $Result.DefaultSelection<Prisma.$RegistrationPayload>
/**
 * Model Admin
 * 
 */
export type Admin = $Result.DefaultSelection<Prisma.$AdminPayload>
/**
 * Model AdminSession
 * 
 */
export type AdminSession = $Result.DefaultSelection<Prisma.$AdminSessionPayload>
/**
 * Model Payment
 * 
 */
export type Payment = $Result.DefaultSelection<Prisma.$PaymentPayload>
/**
 * Model PricingCategory
 * 
 */
export type PricingCategory = $Result.DefaultSelection<Prisma.$PricingCategoryPayload>
/**
 * Model EmailLog
 * 
 */
export type EmailLog = $Result.DefaultSelection<Prisma.$EmailLogPayload>
/**
 * Model RaffleTicket
 * 
 */
export type RaffleTicket = $Result.DefaultSelection<Prisma.$RaffleTicketPayload>
/**
 * Model Referral
 * 
 */
export type Referral = $Result.DefaultSelection<Prisma.$ReferralPayload>
/**
 * Model Donation
 * 
 */
export type Donation = $Result.DefaultSelection<Prisma.$DonationPayload>
/**
 * Model SmsLog
 * 
 */
export type SmsLog = $Result.DefaultSelection<Prisma.$SmsLogPayload>
/**
 * Model ShortLink
 * 
 */
export type ShortLink = $Result.DefaultSelection<Prisma.$ShortLinkPayload>
/**
 * Model BikeHire
 * 
 */
export type BikeHire = $Result.DefaultSelection<Prisma.$BikeHirePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const RegistrationStatus: {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED'
};

export type RegistrationStatus = (typeof RegistrationStatus)[keyof typeof RegistrationStatus]

}

export type RegistrationStatus = $Enums.RegistrationStatus

export const RegistrationStatus: typeof $Enums.RegistrationStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Registrations
 * const registrations = await prisma.registration.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Registrations
   * const registrations = await prisma.registration.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.registration`: Exposes CRUD operations for the **Registration** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Registrations
    * const registrations = await prisma.registration.findMany()
    * ```
    */
  get registration(): Prisma.RegistrationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.admin`: Exposes CRUD operations for the **Admin** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Admins
    * const admins = await prisma.admin.findMany()
    * ```
    */
  get admin(): Prisma.AdminDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.adminSession`: Exposes CRUD operations for the **AdminSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AdminSessions
    * const adminSessions = await prisma.adminSession.findMany()
    * ```
    */
  get adminSession(): Prisma.AdminSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.payment`: Exposes CRUD operations for the **Payment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payments
    * const payments = await prisma.payment.findMany()
    * ```
    */
  get payment(): Prisma.PaymentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pricingCategory`: Exposes CRUD operations for the **PricingCategory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PricingCategories
    * const pricingCategories = await prisma.pricingCategory.findMany()
    * ```
    */
  get pricingCategory(): Prisma.PricingCategoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.emailLog`: Exposes CRUD operations for the **EmailLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EmailLogs
    * const emailLogs = await prisma.emailLog.findMany()
    * ```
    */
  get emailLog(): Prisma.EmailLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.raffleTicket`: Exposes CRUD operations for the **RaffleTicket** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more RaffleTickets
    * const raffleTickets = await prisma.raffleTicket.findMany()
    * ```
    */
  get raffleTicket(): Prisma.RaffleTicketDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.referral`: Exposes CRUD operations for the **Referral** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Referrals
    * const referrals = await prisma.referral.findMany()
    * ```
    */
  get referral(): Prisma.ReferralDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.donation`: Exposes CRUD operations for the **Donation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Donations
    * const donations = await prisma.donation.findMany()
    * ```
    */
  get donation(): Prisma.DonationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.smsLog`: Exposes CRUD operations for the **SmsLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more SmsLogs
    * const smsLogs = await prisma.smsLog.findMany()
    * ```
    */
  get smsLog(): Prisma.SmsLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.shortLink`: Exposes CRUD operations for the **ShortLink** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ShortLinks
    * const shortLinks = await prisma.shortLink.findMany()
    * ```
    */
  get shortLink(): Prisma.ShortLinkDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.bikeHire`: Exposes CRUD operations for the **BikeHire** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BikeHires
    * const bikeHires = await prisma.bikeHire.findMany()
    * ```
    */
  get bikeHire(): Prisma.BikeHireDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Registration: 'Registration',
    Admin: 'Admin',
    AdminSession: 'AdminSession',
    Payment: 'Payment',
    PricingCategory: 'PricingCategory',
    EmailLog: 'EmailLog',
    RaffleTicket: 'RaffleTicket',
    Referral: 'Referral',
    Donation: 'Donation',
    SmsLog: 'SmsLog',
    ShortLink: 'ShortLink',
    BikeHire: 'BikeHire'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "registration" | "admin" | "adminSession" | "payment" | "pricingCategory" | "emailLog" | "raffleTicket" | "referral" | "donation" | "smsLog" | "shortLink" | "bikeHire"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Registration: {
        payload: Prisma.$RegistrationPayload<ExtArgs>
        fields: Prisma.RegistrationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RegistrationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RegistrationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>
          }
          findFirst: {
            args: Prisma.RegistrationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RegistrationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>
          }
          findMany: {
            args: Prisma.RegistrationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>[]
          }
          create: {
            args: Prisma.RegistrationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>
          }
          createMany: {
            args: Prisma.RegistrationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RegistrationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>[]
          }
          delete: {
            args: Prisma.RegistrationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>
          }
          update: {
            args: Prisma.RegistrationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>
          }
          deleteMany: {
            args: Prisma.RegistrationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RegistrationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RegistrationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>[]
          }
          upsert: {
            args: Prisma.RegistrationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RegistrationPayload>
          }
          aggregate: {
            args: Prisma.RegistrationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRegistration>
          }
          groupBy: {
            args: Prisma.RegistrationGroupByArgs<ExtArgs>
            result: $Utils.Optional<RegistrationGroupByOutputType>[]
          }
          count: {
            args: Prisma.RegistrationCountArgs<ExtArgs>
            result: $Utils.Optional<RegistrationCountAggregateOutputType> | number
          }
        }
      }
      Admin: {
        payload: Prisma.$AdminPayload<ExtArgs>
        fields: Prisma.AdminFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AdminFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AdminFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          findFirst: {
            args: Prisma.AdminFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AdminFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          findMany: {
            args: Prisma.AdminFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>[]
          }
          create: {
            args: Prisma.AdminCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          createMany: {
            args: Prisma.AdminCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AdminCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>[]
          }
          delete: {
            args: Prisma.AdminDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          update: {
            args: Prisma.AdminUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          deleteMany: {
            args: Prisma.AdminDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AdminUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AdminUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>[]
          }
          upsert: {
            args: Prisma.AdminUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminPayload>
          }
          aggregate: {
            args: Prisma.AdminAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAdmin>
          }
          groupBy: {
            args: Prisma.AdminGroupByArgs<ExtArgs>
            result: $Utils.Optional<AdminGroupByOutputType>[]
          }
          count: {
            args: Prisma.AdminCountArgs<ExtArgs>
            result: $Utils.Optional<AdminCountAggregateOutputType> | number
          }
        }
      }
      AdminSession: {
        payload: Prisma.$AdminSessionPayload<ExtArgs>
        fields: Prisma.AdminSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AdminSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AdminSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          findFirst: {
            args: Prisma.AdminSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AdminSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          findMany: {
            args: Prisma.AdminSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>[]
          }
          create: {
            args: Prisma.AdminSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          createMany: {
            args: Prisma.AdminSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AdminSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>[]
          }
          delete: {
            args: Prisma.AdminSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          update: {
            args: Prisma.AdminSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          deleteMany: {
            args: Prisma.AdminSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AdminSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AdminSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>[]
          }
          upsert: {
            args: Prisma.AdminSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          aggregate: {
            args: Prisma.AdminSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAdminSession>
          }
          groupBy: {
            args: Prisma.AdminSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<AdminSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.AdminSessionCountArgs<ExtArgs>
            result: $Utils.Optional<AdminSessionCountAggregateOutputType> | number
          }
        }
      }
      Payment: {
        payload: Prisma.$PaymentPayload<ExtArgs>
        fields: Prisma.PaymentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findFirst: {
            args: Prisma.PaymentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findMany: {
            args: Prisma.PaymentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          create: {
            args: Prisma.PaymentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          createMany: {
            args: Prisma.PaymentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          delete: {
            args: Prisma.PaymentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          update: {
            args: Prisma.PaymentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          deleteMany: {
            args: Prisma.PaymentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PaymentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          upsert: {
            args: Prisma.PaymentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          aggregate: {
            args: Prisma.PaymentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayment>
          }
          groupBy: {
            args: Prisma.PaymentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentCountAggregateOutputType> | number
          }
        }
      }
      PricingCategory: {
        payload: Prisma.$PricingCategoryPayload<ExtArgs>
        fields: Prisma.PricingCategoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PricingCategoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PricingCategoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>
          }
          findFirst: {
            args: Prisma.PricingCategoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PricingCategoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>
          }
          findMany: {
            args: Prisma.PricingCategoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>[]
          }
          create: {
            args: Prisma.PricingCategoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>
          }
          createMany: {
            args: Prisma.PricingCategoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PricingCategoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>[]
          }
          delete: {
            args: Prisma.PricingCategoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>
          }
          update: {
            args: Prisma.PricingCategoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>
          }
          deleteMany: {
            args: Prisma.PricingCategoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PricingCategoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PricingCategoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>[]
          }
          upsert: {
            args: Prisma.PricingCategoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PricingCategoryPayload>
          }
          aggregate: {
            args: Prisma.PricingCategoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePricingCategory>
          }
          groupBy: {
            args: Prisma.PricingCategoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<PricingCategoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.PricingCategoryCountArgs<ExtArgs>
            result: $Utils.Optional<PricingCategoryCountAggregateOutputType> | number
          }
        }
      }
      EmailLog: {
        payload: Prisma.$EmailLogPayload<ExtArgs>
        fields: Prisma.EmailLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmailLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmailLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          findFirst: {
            args: Prisma.EmailLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmailLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          findMany: {
            args: Prisma.EmailLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>[]
          }
          create: {
            args: Prisma.EmailLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          createMany: {
            args: Prisma.EmailLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EmailLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>[]
          }
          delete: {
            args: Prisma.EmailLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          update: {
            args: Prisma.EmailLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          deleteMany: {
            args: Prisma.EmailLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmailLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EmailLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>[]
          }
          upsert: {
            args: Prisma.EmailLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          aggregate: {
            args: Prisma.EmailLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmailLog>
          }
          groupBy: {
            args: Prisma.EmailLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmailLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmailLogCountArgs<ExtArgs>
            result: $Utils.Optional<EmailLogCountAggregateOutputType> | number
          }
        }
      }
      RaffleTicket: {
        payload: Prisma.$RaffleTicketPayload<ExtArgs>
        fields: Prisma.RaffleTicketFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RaffleTicketFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RaffleTicketFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>
          }
          findFirst: {
            args: Prisma.RaffleTicketFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RaffleTicketFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>
          }
          findMany: {
            args: Prisma.RaffleTicketFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>[]
          }
          create: {
            args: Prisma.RaffleTicketCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>
          }
          createMany: {
            args: Prisma.RaffleTicketCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RaffleTicketCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>[]
          }
          delete: {
            args: Prisma.RaffleTicketDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>
          }
          update: {
            args: Prisma.RaffleTicketUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>
          }
          deleteMany: {
            args: Prisma.RaffleTicketDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RaffleTicketUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RaffleTicketUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>[]
          }
          upsert: {
            args: Prisma.RaffleTicketUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RaffleTicketPayload>
          }
          aggregate: {
            args: Prisma.RaffleTicketAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRaffleTicket>
          }
          groupBy: {
            args: Prisma.RaffleTicketGroupByArgs<ExtArgs>
            result: $Utils.Optional<RaffleTicketGroupByOutputType>[]
          }
          count: {
            args: Prisma.RaffleTicketCountArgs<ExtArgs>
            result: $Utils.Optional<RaffleTicketCountAggregateOutputType> | number
          }
        }
      }
      Referral: {
        payload: Prisma.$ReferralPayload<ExtArgs>
        fields: Prisma.ReferralFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReferralFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReferralFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          findFirst: {
            args: Prisma.ReferralFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReferralFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          findMany: {
            args: Prisma.ReferralFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>[]
          }
          create: {
            args: Prisma.ReferralCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          createMany: {
            args: Prisma.ReferralCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReferralCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>[]
          }
          delete: {
            args: Prisma.ReferralDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          update: {
            args: Prisma.ReferralUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          deleteMany: {
            args: Prisma.ReferralDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReferralUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReferralUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>[]
          }
          upsert: {
            args: Prisma.ReferralUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralPayload>
          }
          aggregate: {
            args: Prisma.ReferralAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReferral>
          }
          groupBy: {
            args: Prisma.ReferralGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReferralGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReferralCountArgs<ExtArgs>
            result: $Utils.Optional<ReferralCountAggregateOutputType> | number
          }
        }
      }
      Donation: {
        payload: Prisma.$DonationPayload<ExtArgs>
        fields: Prisma.DonationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DonationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DonationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>
          }
          findFirst: {
            args: Prisma.DonationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DonationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>
          }
          findMany: {
            args: Prisma.DonationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>[]
          }
          create: {
            args: Prisma.DonationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>
          }
          createMany: {
            args: Prisma.DonationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DonationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>[]
          }
          delete: {
            args: Prisma.DonationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>
          }
          update: {
            args: Prisma.DonationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>
          }
          deleteMany: {
            args: Prisma.DonationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DonationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DonationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>[]
          }
          upsert: {
            args: Prisma.DonationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DonationPayload>
          }
          aggregate: {
            args: Prisma.DonationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDonation>
          }
          groupBy: {
            args: Prisma.DonationGroupByArgs<ExtArgs>
            result: $Utils.Optional<DonationGroupByOutputType>[]
          }
          count: {
            args: Prisma.DonationCountArgs<ExtArgs>
            result: $Utils.Optional<DonationCountAggregateOutputType> | number
          }
        }
      }
      SmsLog: {
        payload: Prisma.$SmsLogPayload<ExtArgs>
        fields: Prisma.SmsLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SmsLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SmsLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>
          }
          findFirst: {
            args: Prisma.SmsLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SmsLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>
          }
          findMany: {
            args: Prisma.SmsLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>[]
          }
          create: {
            args: Prisma.SmsLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>
          }
          createMany: {
            args: Prisma.SmsLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SmsLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>[]
          }
          delete: {
            args: Prisma.SmsLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>
          }
          update: {
            args: Prisma.SmsLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>
          }
          deleteMany: {
            args: Prisma.SmsLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SmsLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SmsLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>[]
          }
          upsert: {
            args: Prisma.SmsLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SmsLogPayload>
          }
          aggregate: {
            args: Prisma.SmsLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSmsLog>
          }
          groupBy: {
            args: Prisma.SmsLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<SmsLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.SmsLogCountArgs<ExtArgs>
            result: $Utils.Optional<SmsLogCountAggregateOutputType> | number
          }
        }
      }
      ShortLink: {
        payload: Prisma.$ShortLinkPayload<ExtArgs>
        fields: Prisma.ShortLinkFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ShortLinkFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ShortLinkFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>
          }
          findFirst: {
            args: Prisma.ShortLinkFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ShortLinkFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>
          }
          findMany: {
            args: Prisma.ShortLinkFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>[]
          }
          create: {
            args: Prisma.ShortLinkCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>
          }
          createMany: {
            args: Prisma.ShortLinkCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ShortLinkCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>[]
          }
          delete: {
            args: Prisma.ShortLinkDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>
          }
          update: {
            args: Prisma.ShortLinkUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>
          }
          deleteMany: {
            args: Prisma.ShortLinkDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ShortLinkUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ShortLinkUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>[]
          }
          upsert: {
            args: Prisma.ShortLinkUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ShortLinkPayload>
          }
          aggregate: {
            args: Prisma.ShortLinkAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateShortLink>
          }
          groupBy: {
            args: Prisma.ShortLinkGroupByArgs<ExtArgs>
            result: $Utils.Optional<ShortLinkGroupByOutputType>[]
          }
          count: {
            args: Prisma.ShortLinkCountArgs<ExtArgs>
            result: $Utils.Optional<ShortLinkCountAggregateOutputType> | number
          }
        }
      }
      BikeHire: {
        payload: Prisma.$BikeHirePayload<ExtArgs>
        fields: Prisma.BikeHireFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BikeHireFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BikeHireFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>
          }
          findFirst: {
            args: Prisma.BikeHireFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BikeHireFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>
          }
          findMany: {
            args: Prisma.BikeHireFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>[]
          }
          create: {
            args: Prisma.BikeHireCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>
          }
          createMany: {
            args: Prisma.BikeHireCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BikeHireCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>[]
          }
          delete: {
            args: Prisma.BikeHireDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>
          }
          update: {
            args: Prisma.BikeHireUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>
          }
          deleteMany: {
            args: Prisma.BikeHireDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BikeHireUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BikeHireUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>[]
          }
          upsert: {
            args: Prisma.BikeHireUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BikeHirePayload>
          }
          aggregate: {
            args: Prisma.BikeHireAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBikeHire>
          }
          groupBy: {
            args: Prisma.BikeHireGroupByArgs<ExtArgs>
            result: $Utils.Optional<BikeHireGroupByOutputType>[]
          }
          count: {
            args: Prisma.BikeHireCountArgs<ExtArgs>
            result: $Utils.Optional<BikeHireCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    registration?: RegistrationOmit
    admin?: AdminOmit
    adminSession?: AdminSessionOmit
    payment?: PaymentOmit
    pricingCategory?: PricingCategoryOmit
    emailLog?: EmailLogOmit
    raffleTicket?: RaffleTicketOmit
    referral?: ReferralOmit
    donation?: DonationOmit
    smsLog?: SmsLogOmit
    shortLink?: ShortLinkOmit
    bikeHire?: BikeHireOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type AdminCountOutputType
   */

  export type AdminCountOutputType = {
    sessions: number
  }

  export type AdminCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | AdminCountOutputTypeCountSessionsArgs
  }

  // Custom InputTypes
  /**
   * AdminCountOutputType without action
   */
  export type AdminCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminCountOutputType
     */
    select?: AdminCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AdminCountOutputType without action
   */
  export type AdminCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminSessionWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Registration
   */

  export type AggregateRegistration = {
    _count: RegistrationCountAggregateOutputType | null
    _avg: RegistrationAvgAggregateOutputType | null
    _sum: RegistrationSumAggregateOutputType | null
    _min: RegistrationMinAggregateOutputType | null
    _max: RegistrationMaxAggregateOutputType | null
  }

  export type RegistrationAvgAggregateOutputType = {
    totalAmount: number | null
  }

  export type RegistrationSumAggregateOutputType = {
    totalAmount: number | null
  }

  export type RegistrationMinAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    updatedAt: Date | null
    circuitId: string | null
    type: string | null
    status: $Enums.RegistrationStatus | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phoneNumber: string | null
    idNumber: string | null
    dob: string | null
    gender: string | null
    groupId: string | null
    teamName: string | null
    isCaptain: boolean | null
    guardianName: string | null
    emergencyPhone: string | null
    relationship: string | null
    category: string | null
    totalAmount: number | null
    emergencyContactName: string | null
    tshirtSize: string | null
    mpesaCode: string | null
    isMilitary: boolean | null
    rank: string | null
    service: string | null
    serviceNumber: string | null
    unit: string | null
  }

  export type RegistrationMaxAggregateOutputType = {
    id: string | null
    createdAt: Date | null
    updatedAt: Date | null
    circuitId: string | null
    type: string | null
    status: $Enums.RegistrationStatus | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phoneNumber: string | null
    idNumber: string | null
    dob: string | null
    gender: string | null
    groupId: string | null
    teamName: string | null
    isCaptain: boolean | null
    guardianName: string | null
    emergencyPhone: string | null
    relationship: string | null
    category: string | null
    totalAmount: number | null
    emergencyContactName: string | null
    tshirtSize: string | null
    mpesaCode: string | null
    isMilitary: boolean | null
    rank: string | null
    service: string | null
    serviceNumber: string | null
    unit: string | null
  }

  export type RegistrationCountAggregateOutputType = {
    id: number
    createdAt: number
    updatedAt: number
    circuitId: number
    type: number
    status: number
    firstName: number
    lastName: number
    email: number
    phoneNumber: number
    idNumber: number
    dob: number
    gender: number
    groupId: number
    teamName: number
    isCaptain: number
    guardianName: number
    emergencyPhone: number
    relationship: number
    category: number
    totalAmount: number
    payload: number
    pricing: number
    classifications: number
    emergencyContactName: number
    tshirtSize: number
    mpesaCode: number
    isMilitary: number
    rank: number
    service: number
    serviceNumber: number
    unit: number
    _all: number
  }


  export type RegistrationAvgAggregateInputType = {
    totalAmount?: true
  }

  export type RegistrationSumAggregateInputType = {
    totalAmount?: true
  }

  export type RegistrationMinAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    circuitId?: true
    type?: true
    status?: true
    firstName?: true
    lastName?: true
    email?: true
    phoneNumber?: true
    idNumber?: true
    dob?: true
    gender?: true
    groupId?: true
    teamName?: true
    isCaptain?: true
    guardianName?: true
    emergencyPhone?: true
    relationship?: true
    category?: true
    totalAmount?: true
    emergencyContactName?: true
    tshirtSize?: true
    mpesaCode?: true
    isMilitary?: true
    rank?: true
    service?: true
    serviceNumber?: true
    unit?: true
  }

  export type RegistrationMaxAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    circuitId?: true
    type?: true
    status?: true
    firstName?: true
    lastName?: true
    email?: true
    phoneNumber?: true
    idNumber?: true
    dob?: true
    gender?: true
    groupId?: true
    teamName?: true
    isCaptain?: true
    guardianName?: true
    emergencyPhone?: true
    relationship?: true
    category?: true
    totalAmount?: true
    emergencyContactName?: true
    tshirtSize?: true
    mpesaCode?: true
    isMilitary?: true
    rank?: true
    service?: true
    serviceNumber?: true
    unit?: true
  }

  export type RegistrationCountAggregateInputType = {
    id?: true
    createdAt?: true
    updatedAt?: true
    circuitId?: true
    type?: true
    status?: true
    firstName?: true
    lastName?: true
    email?: true
    phoneNumber?: true
    idNumber?: true
    dob?: true
    gender?: true
    groupId?: true
    teamName?: true
    isCaptain?: true
    guardianName?: true
    emergencyPhone?: true
    relationship?: true
    category?: true
    totalAmount?: true
    payload?: true
    pricing?: true
    classifications?: true
    emergencyContactName?: true
    tshirtSize?: true
    mpesaCode?: true
    isMilitary?: true
    rank?: true
    service?: true
    serviceNumber?: true
    unit?: true
    _all?: true
  }

  export type RegistrationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Registration to aggregate.
     */
    where?: RegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Registrations to fetch.
     */
    orderBy?: RegistrationOrderByWithRelationInput | RegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Registrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Registrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Registrations
    **/
    _count?: true | RegistrationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RegistrationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RegistrationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RegistrationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RegistrationMaxAggregateInputType
  }

  export type GetRegistrationAggregateType<T extends RegistrationAggregateArgs> = {
        [P in keyof T & keyof AggregateRegistration]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRegistration[P]>
      : GetScalarType<T[P], AggregateRegistration[P]>
  }




  export type RegistrationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RegistrationWhereInput
    orderBy?: RegistrationOrderByWithAggregationInput | RegistrationOrderByWithAggregationInput[]
    by: RegistrationScalarFieldEnum[] | RegistrationScalarFieldEnum
    having?: RegistrationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RegistrationCountAggregateInputType | true
    _avg?: RegistrationAvgAggregateInputType
    _sum?: RegistrationSumAggregateInputType
    _min?: RegistrationMinAggregateInputType
    _max?: RegistrationMaxAggregateInputType
  }

  export type RegistrationGroupByOutputType = {
    id: string
    createdAt: Date
    updatedAt: Date
    circuitId: string
    type: string
    status: $Enums.RegistrationStatus
    firstName: string
    lastName: string
    email: string | null
    phoneNumber: string | null
    idNumber: string | null
    dob: string | null
    gender: string | null
    groupId: string | null
    teamName: string | null
    isCaptain: boolean
    guardianName: string | null
    emergencyPhone: string | null
    relationship: string | null
    category: string | null
    totalAmount: number
    payload: JsonValue | null
    pricing: JsonValue | null
    classifications: JsonValue | null
    emergencyContactName: string | null
    tshirtSize: string | null
    mpesaCode: string | null
    isMilitary: boolean
    rank: string | null
    service: string | null
    serviceNumber: string | null
    unit: string | null
    _count: RegistrationCountAggregateOutputType | null
    _avg: RegistrationAvgAggregateOutputType | null
    _sum: RegistrationSumAggregateOutputType | null
    _min: RegistrationMinAggregateOutputType | null
    _max: RegistrationMaxAggregateOutputType | null
  }

  type GetRegistrationGroupByPayload<T extends RegistrationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RegistrationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RegistrationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RegistrationGroupByOutputType[P]>
            : GetScalarType<T[P], RegistrationGroupByOutputType[P]>
        }
      >
    >


  export type RegistrationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    circuitId?: boolean
    type?: boolean
    status?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    idNumber?: boolean
    dob?: boolean
    gender?: boolean
    groupId?: boolean
    teamName?: boolean
    isCaptain?: boolean
    guardianName?: boolean
    emergencyPhone?: boolean
    relationship?: boolean
    category?: boolean
    totalAmount?: boolean
    payload?: boolean
    pricing?: boolean
    classifications?: boolean
    emergencyContactName?: boolean
    tshirtSize?: boolean
    mpesaCode?: boolean
    isMilitary?: boolean
    rank?: boolean
    service?: boolean
    serviceNumber?: boolean
    unit?: boolean
    bikeHire?: boolean | Registration$bikeHireArgs<ExtArgs>
  }, ExtArgs["result"]["registration"]>

  export type RegistrationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    circuitId?: boolean
    type?: boolean
    status?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    idNumber?: boolean
    dob?: boolean
    gender?: boolean
    groupId?: boolean
    teamName?: boolean
    isCaptain?: boolean
    guardianName?: boolean
    emergencyPhone?: boolean
    relationship?: boolean
    category?: boolean
    totalAmount?: boolean
    payload?: boolean
    pricing?: boolean
    classifications?: boolean
    emergencyContactName?: boolean
    tshirtSize?: boolean
    mpesaCode?: boolean
    isMilitary?: boolean
    rank?: boolean
    service?: boolean
    serviceNumber?: boolean
    unit?: boolean
  }, ExtArgs["result"]["registration"]>

  export type RegistrationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    circuitId?: boolean
    type?: boolean
    status?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    idNumber?: boolean
    dob?: boolean
    gender?: boolean
    groupId?: boolean
    teamName?: boolean
    isCaptain?: boolean
    guardianName?: boolean
    emergencyPhone?: boolean
    relationship?: boolean
    category?: boolean
    totalAmount?: boolean
    payload?: boolean
    pricing?: boolean
    classifications?: boolean
    emergencyContactName?: boolean
    tshirtSize?: boolean
    mpesaCode?: boolean
    isMilitary?: boolean
    rank?: boolean
    service?: boolean
    serviceNumber?: boolean
    unit?: boolean
  }, ExtArgs["result"]["registration"]>

  export type RegistrationSelectScalar = {
    id?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    circuitId?: boolean
    type?: boolean
    status?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    idNumber?: boolean
    dob?: boolean
    gender?: boolean
    groupId?: boolean
    teamName?: boolean
    isCaptain?: boolean
    guardianName?: boolean
    emergencyPhone?: boolean
    relationship?: boolean
    category?: boolean
    totalAmount?: boolean
    payload?: boolean
    pricing?: boolean
    classifications?: boolean
    emergencyContactName?: boolean
    tshirtSize?: boolean
    mpesaCode?: boolean
    isMilitary?: boolean
    rank?: boolean
    service?: boolean
    serviceNumber?: boolean
    unit?: boolean
  }

  export type RegistrationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "createdAt" | "updatedAt" | "circuitId" | "type" | "status" | "firstName" | "lastName" | "email" | "phoneNumber" | "idNumber" | "dob" | "gender" | "groupId" | "teamName" | "isCaptain" | "guardianName" | "emergencyPhone" | "relationship" | "category" | "totalAmount" | "payload" | "pricing" | "classifications" | "emergencyContactName" | "tshirtSize" | "mpesaCode" | "isMilitary" | "rank" | "service" | "serviceNumber" | "unit", ExtArgs["result"]["registration"]>
  export type RegistrationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    bikeHire?: boolean | Registration$bikeHireArgs<ExtArgs>
  }
  export type RegistrationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type RegistrationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $RegistrationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Registration"
    objects: {
      bikeHire: Prisma.$BikeHirePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      createdAt: Date
      updatedAt: Date
      circuitId: string
      type: string
      status: $Enums.RegistrationStatus
      firstName: string
      lastName: string
      email: string | null
      phoneNumber: string | null
      idNumber: string | null
      dob: string | null
      gender: string | null
      groupId: string | null
      teamName: string | null
      isCaptain: boolean
      guardianName: string | null
      emergencyPhone: string | null
      relationship: string | null
      category: string | null
      totalAmount: number
      payload: Prisma.JsonValue | null
      pricing: Prisma.JsonValue | null
      classifications: Prisma.JsonValue | null
      emergencyContactName: string | null
      tshirtSize: string | null
      mpesaCode: string | null
      isMilitary: boolean
      rank: string | null
      service: string | null
      serviceNumber: string | null
      unit: string | null
    }, ExtArgs["result"]["registration"]>
    composites: {}
  }

  type RegistrationGetPayload<S extends boolean | null | undefined | RegistrationDefaultArgs> = $Result.GetResult<Prisma.$RegistrationPayload, S>

  type RegistrationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RegistrationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RegistrationCountAggregateInputType | true
    }

  export interface RegistrationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Registration'], meta: { name: 'Registration' } }
    /**
     * Find zero or one Registration that matches the filter.
     * @param {RegistrationFindUniqueArgs} args - Arguments to find a Registration
     * @example
     * // Get one Registration
     * const registration = await prisma.registration.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RegistrationFindUniqueArgs>(args: SelectSubset<T, RegistrationFindUniqueArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Registration that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RegistrationFindUniqueOrThrowArgs} args - Arguments to find a Registration
     * @example
     * // Get one Registration
     * const registration = await prisma.registration.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RegistrationFindUniqueOrThrowArgs>(args: SelectSubset<T, RegistrationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Registration that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationFindFirstArgs} args - Arguments to find a Registration
     * @example
     * // Get one Registration
     * const registration = await prisma.registration.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RegistrationFindFirstArgs>(args?: SelectSubset<T, RegistrationFindFirstArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Registration that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationFindFirstOrThrowArgs} args - Arguments to find a Registration
     * @example
     * // Get one Registration
     * const registration = await prisma.registration.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RegistrationFindFirstOrThrowArgs>(args?: SelectSubset<T, RegistrationFindFirstOrThrowArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Registrations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Registrations
     * const registrations = await prisma.registration.findMany()
     * 
     * // Get first 10 Registrations
     * const registrations = await prisma.registration.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const registrationWithIdOnly = await prisma.registration.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RegistrationFindManyArgs>(args?: SelectSubset<T, RegistrationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Registration.
     * @param {RegistrationCreateArgs} args - Arguments to create a Registration.
     * @example
     * // Create one Registration
     * const Registration = await prisma.registration.create({
     *   data: {
     *     // ... data to create a Registration
     *   }
     * })
     * 
     */
    create<T extends RegistrationCreateArgs>(args: SelectSubset<T, RegistrationCreateArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Registrations.
     * @param {RegistrationCreateManyArgs} args - Arguments to create many Registrations.
     * @example
     * // Create many Registrations
     * const registration = await prisma.registration.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RegistrationCreateManyArgs>(args?: SelectSubset<T, RegistrationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Registrations and returns the data saved in the database.
     * @param {RegistrationCreateManyAndReturnArgs} args - Arguments to create many Registrations.
     * @example
     * // Create many Registrations
     * const registration = await prisma.registration.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Registrations and only return the `id`
     * const registrationWithIdOnly = await prisma.registration.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RegistrationCreateManyAndReturnArgs>(args?: SelectSubset<T, RegistrationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Registration.
     * @param {RegistrationDeleteArgs} args - Arguments to delete one Registration.
     * @example
     * // Delete one Registration
     * const Registration = await prisma.registration.delete({
     *   where: {
     *     // ... filter to delete one Registration
     *   }
     * })
     * 
     */
    delete<T extends RegistrationDeleteArgs>(args: SelectSubset<T, RegistrationDeleteArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Registration.
     * @param {RegistrationUpdateArgs} args - Arguments to update one Registration.
     * @example
     * // Update one Registration
     * const registration = await prisma.registration.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RegistrationUpdateArgs>(args: SelectSubset<T, RegistrationUpdateArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Registrations.
     * @param {RegistrationDeleteManyArgs} args - Arguments to filter Registrations to delete.
     * @example
     * // Delete a few Registrations
     * const { count } = await prisma.registration.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RegistrationDeleteManyArgs>(args?: SelectSubset<T, RegistrationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Registrations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Registrations
     * const registration = await prisma.registration.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RegistrationUpdateManyArgs>(args: SelectSubset<T, RegistrationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Registrations and returns the data updated in the database.
     * @param {RegistrationUpdateManyAndReturnArgs} args - Arguments to update many Registrations.
     * @example
     * // Update many Registrations
     * const registration = await prisma.registration.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Registrations and only return the `id`
     * const registrationWithIdOnly = await prisma.registration.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RegistrationUpdateManyAndReturnArgs>(args: SelectSubset<T, RegistrationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Registration.
     * @param {RegistrationUpsertArgs} args - Arguments to update or create a Registration.
     * @example
     * // Update or create a Registration
     * const registration = await prisma.registration.upsert({
     *   create: {
     *     // ... data to create a Registration
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Registration we want to update
     *   }
     * })
     */
    upsert<T extends RegistrationUpsertArgs>(args: SelectSubset<T, RegistrationUpsertArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Registrations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationCountArgs} args - Arguments to filter Registrations to count.
     * @example
     * // Count the number of Registrations
     * const count = await prisma.registration.count({
     *   where: {
     *     // ... the filter for the Registrations we want to count
     *   }
     * })
    **/
    count<T extends RegistrationCountArgs>(
      args?: Subset<T, RegistrationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RegistrationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Registration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RegistrationAggregateArgs>(args: Subset<T, RegistrationAggregateArgs>): Prisma.PrismaPromise<GetRegistrationAggregateType<T>>

    /**
     * Group by Registration.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RegistrationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RegistrationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RegistrationGroupByArgs['orderBy'] }
        : { orderBy?: RegistrationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RegistrationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRegistrationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Registration model
   */
  readonly fields: RegistrationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Registration.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RegistrationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    bikeHire<T extends Registration$bikeHireArgs<ExtArgs> = {}>(args?: Subset<T, Registration$bikeHireArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Registration model
   */
  interface RegistrationFieldRefs {
    readonly id: FieldRef<"Registration", 'String'>
    readonly createdAt: FieldRef<"Registration", 'DateTime'>
    readonly updatedAt: FieldRef<"Registration", 'DateTime'>
    readonly circuitId: FieldRef<"Registration", 'String'>
    readonly type: FieldRef<"Registration", 'String'>
    readonly status: FieldRef<"Registration", 'RegistrationStatus'>
    readonly firstName: FieldRef<"Registration", 'String'>
    readonly lastName: FieldRef<"Registration", 'String'>
    readonly email: FieldRef<"Registration", 'String'>
    readonly phoneNumber: FieldRef<"Registration", 'String'>
    readonly idNumber: FieldRef<"Registration", 'String'>
    readonly dob: FieldRef<"Registration", 'String'>
    readonly gender: FieldRef<"Registration", 'String'>
    readonly groupId: FieldRef<"Registration", 'String'>
    readonly teamName: FieldRef<"Registration", 'String'>
    readonly isCaptain: FieldRef<"Registration", 'Boolean'>
    readonly guardianName: FieldRef<"Registration", 'String'>
    readonly emergencyPhone: FieldRef<"Registration", 'String'>
    readonly relationship: FieldRef<"Registration", 'String'>
    readonly category: FieldRef<"Registration", 'String'>
    readonly totalAmount: FieldRef<"Registration", 'Float'>
    readonly payload: FieldRef<"Registration", 'Json'>
    readonly pricing: FieldRef<"Registration", 'Json'>
    readonly classifications: FieldRef<"Registration", 'Json'>
    readonly emergencyContactName: FieldRef<"Registration", 'String'>
    readonly tshirtSize: FieldRef<"Registration", 'String'>
    readonly mpesaCode: FieldRef<"Registration", 'String'>
    readonly isMilitary: FieldRef<"Registration", 'Boolean'>
    readonly rank: FieldRef<"Registration", 'String'>
    readonly service: FieldRef<"Registration", 'String'>
    readonly serviceNumber: FieldRef<"Registration", 'String'>
    readonly unit: FieldRef<"Registration", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Registration findUnique
   */
  export type RegistrationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * Filter, which Registration to fetch.
     */
    where: RegistrationWhereUniqueInput
  }

  /**
   * Registration findUniqueOrThrow
   */
  export type RegistrationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * Filter, which Registration to fetch.
     */
    where: RegistrationWhereUniqueInput
  }

  /**
   * Registration findFirst
   */
  export type RegistrationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * Filter, which Registration to fetch.
     */
    where?: RegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Registrations to fetch.
     */
    orderBy?: RegistrationOrderByWithRelationInput | RegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Registrations.
     */
    cursor?: RegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Registrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Registrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Registrations.
     */
    distinct?: RegistrationScalarFieldEnum | RegistrationScalarFieldEnum[]
  }

  /**
   * Registration findFirstOrThrow
   */
  export type RegistrationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * Filter, which Registration to fetch.
     */
    where?: RegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Registrations to fetch.
     */
    orderBy?: RegistrationOrderByWithRelationInput | RegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Registrations.
     */
    cursor?: RegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Registrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Registrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Registrations.
     */
    distinct?: RegistrationScalarFieldEnum | RegistrationScalarFieldEnum[]
  }

  /**
   * Registration findMany
   */
  export type RegistrationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * Filter, which Registrations to fetch.
     */
    where?: RegistrationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Registrations to fetch.
     */
    orderBy?: RegistrationOrderByWithRelationInput | RegistrationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Registrations.
     */
    cursor?: RegistrationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Registrations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Registrations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Registrations.
     */
    distinct?: RegistrationScalarFieldEnum | RegistrationScalarFieldEnum[]
  }

  /**
   * Registration create
   */
  export type RegistrationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * The data needed to create a Registration.
     */
    data: XOR<RegistrationCreateInput, RegistrationUncheckedCreateInput>
  }

  /**
   * Registration createMany
   */
  export type RegistrationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Registrations.
     */
    data: RegistrationCreateManyInput | RegistrationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Registration createManyAndReturn
   */
  export type RegistrationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * The data used to create many Registrations.
     */
    data: RegistrationCreateManyInput | RegistrationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Registration update
   */
  export type RegistrationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * The data needed to update a Registration.
     */
    data: XOR<RegistrationUpdateInput, RegistrationUncheckedUpdateInput>
    /**
     * Choose, which Registration to update.
     */
    where: RegistrationWhereUniqueInput
  }

  /**
   * Registration updateMany
   */
  export type RegistrationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Registrations.
     */
    data: XOR<RegistrationUpdateManyMutationInput, RegistrationUncheckedUpdateManyInput>
    /**
     * Filter which Registrations to update
     */
    where?: RegistrationWhereInput
    /**
     * Limit how many Registrations to update.
     */
    limit?: number
  }

  /**
   * Registration updateManyAndReturn
   */
  export type RegistrationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * The data used to update Registrations.
     */
    data: XOR<RegistrationUpdateManyMutationInput, RegistrationUncheckedUpdateManyInput>
    /**
     * Filter which Registrations to update
     */
    where?: RegistrationWhereInput
    /**
     * Limit how many Registrations to update.
     */
    limit?: number
  }

  /**
   * Registration upsert
   */
  export type RegistrationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * The filter to search for the Registration to update in case it exists.
     */
    where: RegistrationWhereUniqueInput
    /**
     * In case the Registration found by the `where` argument doesn't exist, create a new Registration with this data.
     */
    create: XOR<RegistrationCreateInput, RegistrationUncheckedCreateInput>
    /**
     * In case the Registration was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RegistrationUpdateInput, RegistrationUncheckedUpdateInput>
  }

  /**
   * Registration delete
   */
  export type RegistrationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
    /**
     * Filter which Registration to delete.
     */
    where: RegistrationWhereUniqueInput
  }

  /**
   * Registration deleteMany
   */
  export type RegistrationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Registrations to delete
     */
    where?: RegistrationWhereInput
    /**
     * Limit how many Registrations to delete.
     */
    limit?: number
  }

  /**
   * Registration.bikeHire
   */
  export type Registration$bikeHireArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    where?: BikeHireWhereInput
  }

  /**
   * Registration without action
   */
  export type RegistrationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Registration
     */
    select?: RegistrationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Registration
     */
    omit?: RegistrationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RegistrationInclude<ExtArgs> | null
  }


  /**
   * Model Admin
   */

  export type AggregateAdmin = {
    _count: AdminCountAggregateOutputType | null
    _min: AdminMinAggregateOutputType | null
    _max: AdminMaxAggregateOutputType | null
  }

  export type AdminMinAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    name: string | null
    role: string | null
    createdAt: Date | null
    lastLogin: Date | null
  }

  export type AdminMaxAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    name: string | null
    role: string | null
    createdAt: Date | null
    lastLogin: Date | null
  }

  export type AdminCountAggregateOutputType = {
    id: number
    email: number
    passwordHash: number
    name: number
    role: number
    createdAt: number
    lastLogin: number
    _all: number
  }


  export type AdminMinAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    createdAt?: true
    lastLogin?: true
  }

  export type AdminMaxAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    createdAt?: true
    lastLogin?: true
  }

  export type AdminCountAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    createdAt?: true
    lastLogin?: true
    _all?: true
  }

  export type AdminAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Admin to aggregate.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Admins
    **/
    _count?: true | AdminCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AdminMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AdminMaxAggregateInputType
  }

  export type GetAdminAggregateType<T extends AdminAggregateArgs> = {
        [P in keyof T & keyof AggregateAdmin]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAdmin[P]>
      : GetScalarType<T[P], AggregateAdmin[P]>
  }




  export type AdminGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminWhereInput
    orderBy?: AdminOrderByWithAggregationInput | AdminOrderByWithAggregationInput[]
    by: AdminScalarFieldEnum[] | AdminScalarFieldEnum
    having?: AdminScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AdminCountAggregateInputType | true
    _min?: AdminMinAggregateInputType
    _max?: AdminMaxAggregateInputType
  }

  export type AdminGroupByOutputType = {
    id: string
    email: string
    passwordHash: string
    name: string
    role: string
    createdAt: Date
    lastLogin: Date | null
    _count: AdminCountAggregateOutputType | null
    _min: AdminMinAggregateOutputType | null
    _max: AdminMaxAggregateOutputType | null
  }

  type GetAdminGroupByPayload<T extends AdminGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AdminGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AdminGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AdminGroupByOutputType[P]>
            : GetScalarType<T[P], AdminGroupByOutputType[P]>
        }
      >
    >


  export type AdminSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
    lastLogin?: boolean
    sessions?: boolean | Admin$sessionsArgs<ExtArgs>
    _count?: boolean | AdminCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["admin"]>

  export type AdminSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
    lastLogin?: boolean
  }, ExtArgs["result"]["admin"]>

  export type AdminSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
    lastLogin?: boolean
  }, ExtArgs["result"]["admin"]>

  export type AdminSelectScalar = {
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
    lastLogin?: boolean
  }

  export type AdminOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "passwordHash" | "name" | "role" | "createdAt" | "lastLogin", ExtArgs["result"]["admin"]>
  export type AdminInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    sessions?: boolean | Admin$sessionsArgs<ExtArgs>
    _count?: boolean | AdminCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AdminIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type AdminIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $AdminPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Admin"
    objects: {
      sessions: Prisma.$AdminSessionPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      passwordHash: string
      name: string
      role: string
      createdAt: Date
      lastLogin: Date | null
    }, ExtArgs["result"]["admin"]>
    composites: {}
  }

  type AdminGetPayload<S extends boolean | null | undefined | AdminDefaultArgs> = $Result.GetResult<Prisma.$AdminPayload, S>

  type AdminCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AdminFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AdminCountAggregateInputType | true
    }

  export interface AdminDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Admin'], meta: { name: 'Admin' } }
    /**
     * Find zero or one Admin that matches the filter.
     * @param {AdminFindUniqueArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdminFindUniqueArgs>(args: SelectSubset<T, AdminFindUniqueArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Admin that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdminFindUniqueOrThrowArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdminFindUniqueOrThrowArgs>(args: SelectSubset<T, AdminFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Admin that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminFindFirstArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdminFindFirstArgs>(args?: SelectSubset<T, AdminFindFirstArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Admin that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminFindFirstOrThrowArgs} args - Arguments to find a Admin
     * @example
     * // Get one Admin
     * const admin = await prisma.admin.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdminFindFirstOrThrowArgs>(args?: SelectSubset<T, AdminFindFirstOrThrowArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Admins that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Admins
     * const admins = await prisma.admin.findMany()
     * 
     * // Get first 10 Admins
     * const admins = await prisma.admin.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const adminWithIdOnly = await prisma.admin.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AdminFindManyArgs>(args?: SelectSubset<T, AdminFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Admin.
     * @param {AdminCreateArgs} args - Arguments to create a Admin.
     * @example
     * // Create one Admin
     * const Admin = await prisma.admin.create({
     *   data: {
     *     // ... data to create a Admin
     *   }
     * })
     * 
     */
    create<T extends AdminCreateArgs>(args: SelectSubset<T, AdminCreateArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Admins.
     * @param {AdminCreateManyArgs} args - Arguments to create many Admins.
     * @example
     * // Create many Admins
     * const admin = await prisma.admin.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AdminCreateManyArgs>(args?: SelectSubset<T, AdminCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Admins and returns the data saved in the database.
     * @param {AdminCreateManyAndReturnArgs} args - Arguments to create many Admins.
     * @example
     * // Create many Admins
     * const admin = await prisma.admin.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Admins and only return the `id`
     * const adminWithIdOnly = await prisma.admin.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AdminCreateManyAndReturnArgs>(args?: SelectSubset<T, AdminCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Admin.
     * @param {AdminDeleteArgs} args - Arguments to delete one Admin.
     * @example
     * // Delete one Admin
     * const Admin = await prisma.admin.delete({
     *   where: {
     *     // ... filter to delete one Admin
     *   }
     * })
     * 
     */
    delete<T extends AdminDeleteArgs>(args: SelectSubset<T, AdminDeleteArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Admin.
     * @param {AdminUpdateArgs} args - Arguments to update one Admin.
     * @example
     * // Update one Admin
     * const admin = await prisma.admin.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AdminUpdateArgs>(args: SelectSubset<T, AdminUpdateArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Admins.
     * @param {AdminDeleteManyArgs} args - Arguments to filter Admins to delete.
     * @example
     * // Delete a few Admins
     * const { count } = await prisma.admin.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AdminDeleteManyArgs>(args?: SelectSubset<T, AdminDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Admins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Admins
     * const admin = await prisma.admin.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AdminUpdateManyArgs>(args: SelectSubset<T, AdminUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Admins and returns the data updated in the database.
     * @param {AdminUpdateManyAndReturnArgs} args - Arguments to update many Admins.
     * @example
     * // Update many Admins
     * const admin = await prisma.admin.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Admins and only return the `id`
     * const adminWithIdOnly = await prisma.admin.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AdminUpdateManyAndReturnArgs>(args: SelectSubset<T, AdminUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Admin.
     * @param {AdminUpsertArgs} args - Arguments to update or create a Admin.
     * @example
     * // Update or create a Admin
     * const admin = await prisma.admin.upsert({
     *   create: {
     *     // ... data to create a Admin
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Admin we want to update
     *   }
     * })
     */
    upsert<T extends AdminUpsertArgs>(args: SelectSubset<T, AdminUpsertArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Admins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminCountArgs} args - Arguments to filter Admins to count.
     * @example
     * // Count the number of Admins
     * const count = await prisma.admin.count({
     *   where: {
     *     // ... the filter for the Admins we want to count
     *   }
     * })
    **/
    count<T extends AdminCountArgs>(
      args?: Subset<T, AdminCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AdminCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Admin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AdminAggregateArgs>(args: Subset<T, AdminAggregateArgs>): Prisma.PrismaPromise<GetAdminAggregateType<T>>

    /**
     * Group by Admin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AdminGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AdminGroupByArgs['orderBy'] }
        : { orderBy?: AdminGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AdminGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Admin model
   */
  readonly fields: AdminFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Admin.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AdminClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    sessions<T extends Admin$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, Admin$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Admin model
   */
  interface AdminFieldRefs {
    readonly id: FieldRef<"Admin", 'String'>
    readonly email: FieldRef<"Admin", 'String'>
    readonly passwordHash: FieldRef<"Admin", 'String'>
    readonly name: FieldRef<"Admin", 'String'>
    readonly role: FieldRef<"Admin", 'String'>
    readonly createdAt: FieldRef<"Admin", 'DateTime'>
    readonly lastLogin: FieldRef<"Admin", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Admin findUnique
   */
  export type AdminFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin findUniqueOrThrow
   */
  export type AdminFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin findFirst
   */
  export type AdminFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Admins.
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Admins.
     */
    distinct?: AdminScalarFieldEnum | AdminScalarFieldEnum[]
  }

  /**
   * Admin findFirstOrThrow
   */
  export type AdminFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admin to fetch.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Admins.
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Admins.
     */
    distinct?: AdminScalarFieldEnum | AdminScalarFieldEnum[]
  }

  /**
   * Admin findMany
   */
  export type AdminFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter, which Admins to fetch.
     */
    where?: AdminWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Admins to fetch.
     */
    orderBy?: AdminOrderByWithRelationInput | AdminOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Admins.
     */
    cursor?: AdminWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Admins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Admins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Admins.
     */
    distinct?: AdminScalarFieldEnum | AdminScalarFieldEnum[]
  }

  /**
   * Admin create
   */
  export type AdminCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * The data needed to create a Admin.
     */
    data: XOR<AdminCreateInput, AdminUncheckedCreateInput>
  }

  /**
   * Admin createMany
   */
  export type AdminCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Admins.
     */
    data: AdminCreateManyInput | AdminCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Admin createManyAndReturn
   */
  export type AdminCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * The data used to create many Admins.
     */
    data: AdminCreateManyInput | AdminCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Admin update
   */
  export type AdminUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * The data needed to update a Admin.
     */
    data: XOR<AdminUpdateInput, AdminUncheckedUpdateInput>
    /**
     * Choose, which Admin to update.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin updateMany
   */
  export type AdminUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Admins.
     */
    data: XOR<AdminUpdateManyMutationInput, AdminUncheckedUpdateManyInput>
    /**
     * Filter which Admins to update
     */
    where?: AdminWhereInput
    /**
     * Limit how many Admins to update.
     */
    limit?: number
  }

  /**
   * Admin updateManyAndReturn
   */
  export type AdminUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * The data used to update Admins.
     */
    data: XOR<AdminUpdateManyMutationInput, AdminUncheckedUpdateManyInput>
    /**
     * Filter which Admins to update
     */
    where?: AdminWhereInput
    /**
     * Limit how many Admins to update.
     */
    limit?: number
  }

  /**
   * Admin upsert
   */
  export type AdminUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * The filter to search for the Admin to update in case it exists.
     */
    where: AdminWhereUniqueInput
    /**
     * In case the Admin found by the `where` argument doesn't exist, create a new Admin with this data.
     */
    create: XOR<AdminCreateInput, AdminUncheckedCreateInput>
    /**
     * In case the Admin was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AdminUpdateInput, AdminUncheckedUpdateInput>
  }

  /**
   * Admin delete
   */
  export type AdminDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
    /**
     * Filter which Admin to delete.
     */
    where: AdminWhereUniqueInput
  }

  /**
   * Admin deleteMany
   */
  export type AdminDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Admins to delete
     */
    where?: AdminWhereInput
    /**
     * Limit how many Admins to delete.
     */
    limit?: number
  }

  /**
   * Admin.sessions
   */
  export type Admin$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    where?: AdminSessionWhereInput
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    cursor?: AdminSessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * Admin without action
   */
  export type AdminDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admin
     */
    select?: AdminSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Admin
     */
    omit?: AdminOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminInclude<ExtArgs> | null
  }


  /**
   * Model AdminSession
   */

  export type AggregateAdminSession = {
    _count: AdminSessionCountAggregateOutputType | null
    _min: AdminSessionMinAggregateOutputType | null
    _max: AdminSessionMaxAggregateOutputType | null
  }

  export type AdminSessionMinAggregateOutputType = {
    id: string | null
    adminId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type AdminSessionMaxAggregateOutputType = {
    id: string | null
    adminId: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type AdminSessionCountAggregateOutputType = {
    id: number
    adminId: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type AdminSessionMinAggregateInputType = {
    id?: true
    adminId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type AdminSessionMaxAggregateInputType = {
    id?: true
    adminId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type AdminSessionCountAggregateInputType = {
    id?: true
    adminId?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type AdminSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminSession to aggregate.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AdminSessions
    **/
    _count?: true | AdminSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AdminSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AdminSessionMaxAggregateInputType
  }

  export type GetAdminSessionAggregateType<T extends AdminSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateAdminSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAdminSession[P]>
      : GetScalarType<T[P], AggregateAdminSession[P]>
  }




  export type AdminSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminSessionWhereInput
    orderBy?: AdminSessionOrderByWithAggregationInput | AdminSessionOrderByWithAggregationInput[]
    by: AdminSessionScalarFieldEnum[] | AdminSessionScalarFieldEnum
    having?: AdminSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AdminSessionCountAggregateInputType | true
    _min?: AdminSessionMinAggregateInputType
    _max?: AdminSessionMaxAggregateInputType
  }

  export type AdminSessionGroupByOutputType = {
    id: string
    adminId: string
    token: string
    expiresAt: Date
    createdAt: Date
    _count: AdminSessionCountAggregateOutputType | null
    _min: AdminSessionMinAggregateOutputType | null
    _max: AdminSessionMaxAggregateOutputType | null
  }

  type GetAdminSessionGroupByPayload<T extends AdminSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AdminSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AdminSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AdminSessionGroupByOutputType[P]>
            : GetScalarType<T[P], AdminSessionGroupByOutputType[P]>
        }
      >
    >


  export type AdminSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    adminId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    admin?: boolean | AdminDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["adminSession"]>

  export type AdminSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    adminId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    admin?: boolean | AdminDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["adminSession"]>

  export type AdminSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    adminId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    admin?: boolean | AdminDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["adminSession"]>

  export type AdminSessionSelectScalar = {
    id?: boolean
    adminId?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type AdminSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "adminId" | "token" | "expiresAt" | "createdAt", ExtArgs["result"]["adminSession"]>
  export type AdminSessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    admin?: boolean | AdminDefaultArgs<ExtArgs>
  }
  export type AdminSessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    admin?: boolean | AdminDefaultArgs<ExtArgs>
  }
  export type AdminSessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    admin?: boolean | AdminDefaultArgs<ExtArgs>
  }

  export type $AdminSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AdminSession"
    objects: {
      admin: Prisma.$AdminPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      adminId: string
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["adminSession"]>
    composites: {}
  }

  type AdminSessionGetPayload<S extends boolean | null | undefined | AdminSessionDefaultArgs> = $Result.GetResult<Prisma.$AdminSessionPayload, S>

  type AdminSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AdminSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AdminSessionCountAggregateInputType | true
    }

  export interface AdminSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AdminSession'], meta: { name: 'AdminSession' } }
    /**
     * Find zero or one AdminSession that matches the filter.
     * @param {AdminSessionFindUniqueArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdminSessionFindUniqueArgs>(args: SelectSubset<T, AdminSessionFindUniqueArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AdminSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdminSessionFindUniqueOrThrowArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdminSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, AdminSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionFindFirstArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdminSessionFindFirstArgs>(args?: SelectSubset<T, AdminSessionFindFirstArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionFindFirstOrThrowArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdminSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, AdminSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AdminSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AdminSessions
     * const adminSessions = await prisma.adminSession.findMany()
     * 
     * // Get first 10 AdminSessions
     * const adminSessions = await prisma.adminSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const adminSessionWithIdOnly = await prisma.adminSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AdminSessionFindManyArgs>(args?: SelectSubset<T, AdminSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AdminSession.
     * @param {AdminSessionCreateArgs} args - Arguments to create a AdminSession.
     * @example
     * // Create one AdminSession
     * const AdminSession = await prisma.adminSession.create({
     *   data: {
     *     // ... data to create a AdminSession
     *   }
     * })
     * 
     */
    create<T extends AdminSessionCreateArgs>(args: SelectSubset<T, AdminSessionCreateArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AdminSessions.
     * @param {AdminSessionCreateManyArgs} args - Arguments to create many AdminSessions.
     * @example
     * // Create many AdminSessions
     * const adminSession = await prisma.adminSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AdminSessionCreateManyArgs>(args?: SelectSubset<T, AdminSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AdminSessions and returns the data saved in the database.
     * @param {AdminSessionCreateManyAndReturnArgs} args - Arguments to create many AdminSessions.
     * @example
     * // Create many AdminSessions
     * const adminSession = await prisma.adminSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AdminSessions and only return the `id`
     * const adminSessionWithIdOnly = await prisma.adminSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AdminSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, AdminSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AdminSession.
     * @param {AdminSessionDeleteArgs} args - Arguments to delete one AdminSession.
     * @example
     * // Delete one AdminSession
     * const AdminSession = await prisma.adminSession.delete({
     *   where: {
     *     // ... filter to delete one AdminSession
     *   }
     * })
     * 
     */
    delete<T extends AdminSessionDeleteArgs>(args: SelectSubset<T, AdminSessionDeleteArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AdminSession.
     * @param {AdminSessionUpdateArgs} args - Arguments to update one AdminSession.
     * @example
     * // Update one AdminSession
     * const adminSession = await prisma.adminSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AdminSessionUpdateArgs>(args: SelectSubset<T, AdminSessionUpdateArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AdminSessions.
     * @param {AdminSessionDeleteManyArgs} args - Arguments to filter AdminSessions to delete.
     * @example
     * // Delete a few AdminSessions
     * const { count } = await prisma.adminSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AdminSessionDeleteManyArgs>(args?: SelectSubset<T, AdminSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AdminSessions
     * const adminSession = await prisma.adminSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AdminSessionUpdateManyArgs>(args: SelectSubset<T, AdminSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminSessions and returns the data updated in the database.
     * @param {AdminSessionUpdateManyAndReturnArgs} args - Arguments to update many AdminSessions.
     * @example
     * // Update many AdminSessions
     * const adminSession = await prisma.adminSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AdminSessions and only return the `id`
     * const adminSessionWithIdOnly = await prisma.adminSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AdminSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, AdminSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AdminSession.
     * @param {AdminSessionUpsertArgs} args - Arguments to update or create a AdminSession.
     * @example
     * // Update or create a AdminSession
     * const adminSession = await prisma.adminSession.upsert({
     *   create: {
     *     // ... data to create a AdminSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AdminSession we want to update
     *   }
     * })
     */
    upsert<T extends AdminSessionUpsertArgs>(args: SelectSubset<T, AdminSessionUpsertArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AdminSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionCountArgs} args - Arguments to filter AdminSessions to count.
     * @example
     * // Count the number of AdminSessions
     * const count = await prisma.adminSession.count({
     *   where: {
     *     // ... the filter for the AdminSessions we want to count
     *   }
     * })
    **/
    count<T extends AdminSessionCountArgs>(
      args?: Subset<T, AdminSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AdminSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AdminSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AdminSessionAggregateArgs>(args: Subset<T, AdminSessionAggregateArgs>): Prisma.PrismaPromise<GetAdminSessionAggregateType<T>>

    /**
     * Group by AdminSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AdminSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AdminSessionGroupByArgs['orderBy'] }
        : { orderBy?: AdminSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AdminSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AdminSession model
   */
  readonly fields: AdminSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AdminSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AdminSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    admin<T extends AdminDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AdminDefaultArgs<ExtArgs>>): Prisma__AdminClient<$Result.GetResult<Prisma.$AdminPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AdminSession model
   */
  interface AdminSessionFieldRefs {
    readonly id: FieldRef<"AdminSession", 'String'>
    readonly adminId: FieldRef<"AdminSession", 'String'>
    readonly token: FieldRef<"AdminSession", 'String'>
    readonly expiresAt: FieldRef<"AdminSession", 'DateTime'>
    readonly createdAt: FieldRef<"AdminSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AdminSession findUnique
   */
  export type AdminSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession findUniqueOrThrow
   */
  export type AdminSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession findFirst
   */
  export type AdminSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminSessions.
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminSessions.
     */
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * AdminSession findFirstOrThrow
   */
  export type AdminSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminSessions.
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminSessions.
     */
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * AdminSession findMany
   */
  export type AdminSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * Filter, which AdminSessions to fetch.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AdminSessions.
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminSessions.
     */
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * AdminSession create
   */
  export type AdminSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * The data needed to create a AdminSession.
     */
    data: XOR<AdminSessionCreateInput, AdminSessionUncheckedCreateInput>
  }

  /**
   * AdminSession createMany
   */
  export type AdminSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AdminSessions.
     */
    data: AdminSessionCreateManyInput | AdminSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AdminSession createManyAndReturn
   */
  export type AdminSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The data used to create many AdminSessions.
     */
    data: AdminSessionCreateManyInput | AdminSessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AdminSession update
   */
  export type AdminSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * The data needed to update a AdminSession.
     */
    data: XOR<AdminSessionUpdateInput, AdminSessionUncheckedUpdateInput>
    /**
     * Choose, which AdminSession to update.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession updateMany
   */
  export type AdminSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AdminSessions.
     */
    data: XOR<AdminSessionUpdateManyMutationInput, AdminSessionUncheckedUpdateManyInput>
    /**
     * Filter which AdminSessions to update
     */
    where?: AdminSessionWhereInput
    /**
     * Limit how many AdminSessions to update.
     */
    limit?: number
  }

  /**
   * AdminSession updateManyAndReturn
   */
  export type AdminSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The data used to update AdminSessions.
     */
    data: XOR<AdminSessionUpdateManyMutationInput, AdminSessionUncheckedUpdateManyInput>
    /**
     * Filter which AdminSessions to update
     */
    where?: AdminSessionWhereInput
    /**
     * Limit how many AdminSessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AdminSession upsert
   */
  export type AdminSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * The filter to search for the AdminSession to update in case it exists.
     */
    where: AdminSessionWhereUniqueInput
    /**
     * In case the AdminSession found by the `where` argument doesn't exist, create a new AdminSession with this data.
     */
    create: XOR<AdminSessionCreateInput, AdminSessionUncheckedCreateInput>
    /**
     * In case the AdminSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AdminSessionUpdateInput, AdminSessionUncheckedUpdateInput>
  }

  /**
   * AdminSession delete
   */
  export type AdminSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
    /**
     * Filter which AdminSession to delete.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession deleteMany
   */
  export type AdminSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminSessions to delete
     */
    where?: AdminSessionWhereInput
    /**
     * Limit how many AdminSessions to delete.
     */
    limit?: number
  }

  /**
   * AdminSession without action
   */
  export type AdminSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AdminSessionInclude<ExtArgs> | null
  }


  /**
   * Model Payment
   */

  export type AggregatePayment = {
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  export type PaymentAvgAggregateOutputType = {
    amount: number | null
  }

  export type PaymentSumAggregateOutputType = {
    amount: number | null
  }

  export type PaymentMinAggregateOutputType = {
    id: string | null
    registrationId: string | null
    donationId: string | null
    checkoutRequestId: string | null
    merchantRequestId: string | null
    phone: string | null
    amount: number | null
    status: string | null
    failureReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
    mpesaReceiptNumber: string | null
    transactionDate: string | null
    mnoReference: string | null
    cbsReference: string | null
  }

  export type PaymentMaxAggregateOutputType = {
    id: string | null
    registrationId: string | null
    donationId: string | null
    checkoutRequestId: string | null
    merchantRequestId: string | null
    phone: string | null
    amount: number | null
    status: string | null
    failureReason: string | null
    createdAt: Date | null
    updatedAt: Date | null
    mpesaReceiptNumber: string | null
    transactionDate: string | null
    mnoReference: string | null
    cbsReference: string | null
  }

  export type PaymentCountAggregateOutputType = {
    id: number
    registrationId: number
    raffleTicketIds: number
    donationId: number
    checkoutRequestId: number
    merchantRequestId: number
    phone: number
    amount: number
    status: number
    failureReason: number
    createdAt: number
    updatedAt: number
    mpesaReceiptNumber: number
    transactionDate: number
    mnoReference: number
    cbsReference: number
    paymentDetails: number
    _all: number
  }


  export type PaymentAvgAggregateInputType = {
    amount?: true
  }

  export type PaymentSumAggregateInputType = {
    amount?: true
  }

  export type PaymentMinAggregateInputType = {
    id?: true
    registrationId?: true
    donationId?: true
    checkoutRequestId?: true
    merchantRequestId?: true
    phone?: true
    amount?: true
    status?: true
    failureReason?: true
    createdAt?: true
    updatedAt?: true
    mpesaReceiptNumber?: true
    transactionDate?: true
    mnoReference?: true
    cbsReference?: true
  }

  export type PaymentMaxAggregateInputType = {
    id?: true
    registrationId?: true
    donationId?: true
    checkoutRequestId?: true
    merchantRequestId?: true
    phone?: true
    amount?: true
    status?: true
    failureReason?: true
    createdAt?: true
    updatedAt?: true
    mpesaReceiptNumber?: true
    transactionDate?: true
    mnoReference?: true
    cbsReference?: true
  }

  export type PaymentCountAggregateInputType = {
    id?: true
    registrationId?: true
    raffleTicketIds?: true
    donationId?: true
    checkoutRequestId?: true
    merchantRequestId?: true
    phone?: true
    amount?: true
    status?: true
    failureReason?: true
    createdAt?: true
    updatedAt?: true
    mpesaReceiptNumber?: true
    transactionDate?: true
    mnoReference?: true
    cbsReference?: true
    paymentDetails?: true
    _all?: true
  }

  export type PaymentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payment to aggregate.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Payments
    **/
    _count?: true | PaymentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PaymentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PaymentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentMaxAggregateInputType
  }

  export type GetPaymentAggregateType<T extends PaymentAggregateArgs> = {
        [P in keyof T & keyof AggregatePayment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayment[P]>
      : GetScalarType<T[P], AggregatePayment[P]>
  }




  export type PaymentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithAggregationInput | PaymentOrderByWithAggregationInput[]
    by: PaymentScalarFieldEnum[] | PaymentScalarFieldEnum
    having?: PaymentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentCountAggregateInputType | true
    _avg?: PaymentAvgAggregateInputType
    _sum?: PaymentSumAggregateInputType
    _min?: PaymentMinAggregateInputType
    _max?: PaymentMaxAggregateInputType
  }

  export type PaymentGroupByOutputType = {
    id: string
    registrationId: string | null
    raffleTicketIds: string[]
    donationId: string | null
    checkoutRequestId: string | null
    merchantRequestId: string | null
    phone: string | null
    amount: number
    status: string
    failureReason: string | null
    createdAt: Date
    updatedAt: Date
    mpesaReceiptNumber: string | null
    transactionDate: string | null
    mnoReference: string | null
    cbsReference: string | null
    paymentDetails: JsonValue | null
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  type GetPaymentGroupByPayload<T extends PaymentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentGroupByOutputType[P]>
        }
      >
    >


  export type PaymentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    raffleTicketIds?: boolean
    donationId?: boolean
    checkoutRequestId?: boolean
    merchantRequestId?: boolean
    phone?: boolean
    amount?: boolean
    status?: boolean
    failureReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    mpesaReceiptNumber?: boolean
    transactionDate?: boolean
    mnoReference?: boolean
    cbsReference?: boolean
    paymentDetails?: boolean
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    raffleTicketIds?: boolean
    donationId?: boolean
    checkoutRequestId?: boolean
    merchantRequestId?: boolean
    phone?: boolean
    amount?: boolean
    status?: boolean
    failureReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    mpesaReceiptNumber?: boolean
    transactionDate?: boolean
    mnoReference?: boolean
    cbsReference?: boolean
    paymentDetails?: boolean
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    raffleTicketIds?: boolean
    donationId?: boolean
    checkoutRequestId?: boolean
    merchantRequestId?: boolean
    phone?: boolean
    amount?: boolean
    status?: boolean
    failureReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    mpesaReceiptNumber?: boolean
    transactionDate?: boolean
    mnoReference?: boolean
    cbsReference?: boolean
    paymentDetails?: boolean
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectScalar = {
    id?: boolean
    registrationId?: boolean
    raffleTicketIds?: boolean
    donationId?: boolean
    checkoutRequestId?: boolean
    merchantRequestId?: boolean
    phone?: boolean
    amount?: boolean
    status?: boolean
    failureReason?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    mpesaReceiptNumber?: boolean
    transactionDate?: boolean
    mnoReference?: boolean
    cbsReference?: boolean
    paymentDetails?: boolean
  }

  export type PaymentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "registrationId" | "raffleTicketIds" | "donationId" | "checkoutRequestId" | "merchantRequestId" | "phone" | "amount" | "status" | "failureReason" | "createdAt" | "updatedAt" | "mpesaReceiptNumber" | "transactionDate" | "mnoReference" | "cbsReference" | "paymentDetails", ExtArgs["result"]["payment"]>

  export type $PaymentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payment"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      registrationId: string | null
      raffleTicketIds: string[]
      donationId: string | null
      checkoutRequestId: string | null
      merchantRequestId: string | null
      phone: string | null
      amount: number
      status: string
      failureReason: string | null
      createdAt: Date
      updatedAt: Date
      mpesaReceiptNumber: string | null
      transactionDate: string | null
      mnoReference: string | null
      cbsReference: string | null
      paymentDetails: Prisma.JsonValue | null
    }, ExtArgs["result"]["payment"]>
    composites: {}
  }

  type PaymentGetPayload<S extends boolean | null | undefined | PaymentDefaultArgs> = $Result.GetResult<Prisma.$PaymentPayload, S>

  type PaymentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PaymentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PaymentCountAggregateInputType | true
    }

  export interface PaymentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payment'], meta: { name: 'Payment' } }
    /**
     * Find zero or one Payment that matches the filter.
     * @param {PaymentFindUniqueArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentFindUniqueArgs>(args: SelectSubset<T, PaymentFindUniqueArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Payment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PaymentFindUniqueOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentFindFirstArgs>(args?: SelectSubset<T, PaymentFindFirstArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Payments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payments
     * const payments = await prisma.payment.findMany()
     * 
     * // Get first 10 Payments
     * const payments = await prisma.payment.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentWithIdOnly = await prisma.payment.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentFindManyArgs>(args?: SelectSubset<T, PaymentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Payment.
     * @param {PaymentCreateArgs} args - Arguments to create a Payment.
     * @example
     * // Create one Payment
     * const Payment = await prisma.payment.create({
     *   data: {
     *     // ... data to create a Payment
     *   }
     * })
     * 
     */
    create<T extends PaymentCreateArgs>(args: SelectSubset<T, PaymentCreateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Payments.
     * @param {PaymentCreateManyArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentCreateManyArgs>(args?: SelectSubset<T, PaymentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payments and returns the data saved in the database.
     * @param {PaymentCreateManyAndReturnArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Payment.
     * @param {PaymentDeleteArgs} args - Arguments to delete one Payment.
     * @example
     * // Delete one Payment
     * const Payment = await prisma.payment.delete({
     *   where: {
     *     // ... filter to delete one Payment
     *   }
     * })
     * 
     */
    delete<T extends PaymentDeleteArgs>(args: SelectSubset<T, PaymentDeleteArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Payment.
     * @param {PaymentUpdateArgs} args - Arguments to update one Payment.
     * @example
     * // Update one Payment
     * const payment = await prisma.payment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentUpdateArgs>(args: SelectSubset<T, PaymentUpdateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Payments.
     * @param {PaymentDeleteManyArgs} args - Arguments to filter Payments to delete.
     * @example
     * // Delete a few Payments
     * const { count } = await prisma.payment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentDeleteManyArgs>(args?: SelectSubset<T, PaymentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentUpdateManyArgs>(args: SelectSubset<T, PaymentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments and returns the data updated in the database.
     * @param {PaymentUpdateManyAndReturnArgs} args - Arguments to update many Payments.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PaymentUpdateManyAndReturnArgs>(args: SelectSubset<T, PaymentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Payment.
     * @param {PaymentUpsertArgs} args - Arguments to update or create a Payment.
     * @example
     * // Update or create a Payment
     * const payment = await prisma.payment.upsert({
     *   create: {
     *     // ... data to create a Payment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payment we want to update
     *   }
     * })
     */
    upsert<T extends PaymentUpsertArgs>(args: SelectSubset<T, PaymentUpsertArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentCountArgs} args - Arguments to filter Payments to count.
     * @example
     * // Count the number of Payments
     * const count = await prisma.payment.count({
     *   where: {
     *     // ... the filter for the Payments we want to count
     *   }
     * })
    **/
    count<T extends PaymentCountArgs>(
      args?: Subset<T, PaymentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PaymentAggregateArgs>(args: Subset<T, PaymentAggregateArgs>): Prisma.PrismaPromise<GetPaymentAggregateType<T>>

    /**
     * Group by Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PaymentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentGroupByArgs['orderBy'] }
        : { orderBy?: PaymentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PaymentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payment model
   */
  readonly fields: PaymentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Payment model
   */
  interface PaymentFieldRefs {
    readonly id: FieldRef<"Payment", 'String'>
    readonly registrationId: FieldRef<"Payment", 'String'>
    readonly raffleTicketIds: FieldRef<"Payment", 'String[]'>
    readonly donationId: FieldRef<"Payment", 'String'>
    readonly checkoutRequestId: FieldRef<"Payment", 'String'>
    readonly merchantRequestId: FieldRef<"Payment", 'String'>
    readonly phone: FieldRef<"Payment", 'String'>
    readonly amount: FieldRef<"Payment", 'Float'>
    readonly status: FieldRef<"Payment", 'String'>
    readonly failureReason: FieldRef<"Payment", 'String'>
    readonly createdAt: FieldRef<"Payment", 'DateTime'>
    readonly updatedAt: FieldRef<"Payment", 'DateTime'>
    readonly mpesaReceiptNumber: FieldRef<"Payment", 'String'>
    readonly transactionDate: FieldRef<"Payment", 'String'>
    readonly mnoReference: FieldRef<"Payment", 'String'>
    readonly cbsReference: FieldRef<"Payment", 'String'>
    readonly paymentDetails: FieldRef<"Payment", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Payment findUnique
   */
  export type PaymentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findUniqueOrThrow
   */
  export type PaymentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findFirst
   */
  export type PaymentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findFirstOrThrow
   */
  export type PaymentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findMany
   */
  export type PaymentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payments to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment create
   */
  export type PaymentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data needed to create a Payment.
     */
    data: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
  }

  /**
   * Payment createMany
   */
  export type PaymentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment createManyAndReturn
   */
  export type PaymentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment update
   */
  export type PaymentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data needed to update a Payment.
     */
    data: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
    /**
     * Choose, which Payment to update.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment updateMany
   */
  export type PaymentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to update.
     */
    limit?: number
  }

  /**
   * Payment updateManyAndReturn
   */
  export type PaymentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to update.
     */
    limit?: number
  }

  /**
   * Payment upsert
   */
  export type PaymentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The filter to search for the Payment to update in case it exists.
     */
    where: PaymentWhereUniqueInput
    /**
     * In case the Payment found by the `where` argument doesn't exist, create a new Payment with this data.
     */
    create: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
    /**
     * In case the Payment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
  }

  /**
   * Payment delete
   */
  export type PaymentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter which Payment to delete.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment deleteMany
   */
  export type PaymentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payments to delete
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to delete.
     */
    limit?: number
  }

  /**
   * Payment without action
   */
  export type PaymentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
  }


  /**
   * Model PricingCategory
   */

  export type AggregatePricingCategory = {
    _count: PricingCategoryCountAggregateOutputType | null
    _avg: PricingCategoryAvgAggregateOutputType | null
    _sum: PricingCategorySumAggregateOutputType | null
    _min: PricingCategoryMinAggregateOutputType | null
    _max: PricingCategoryMaxAggregateOutputType | null
  }

  export type PricingCategoryAvgAggregateOutputType = {
    minAge: number | null
    maxAge: number | null
    price: number | null
  }

  export type PricingCategorySumAggregateOutputType = {
    minAge: number | null
    maxAge: number | null
    price: number | null
  }

  export type PricingCategoryMinAggregateOutputType = {
    id: string | null
    circuitId: string | null
    type: string | null
    familyCategory: string | null
    minAge: number | null
    maxAge: number | null
    categoryName: string | null
    regRange: string | null
    price: number | null
    colorCode: string | null
    hexColor: string | null
    remarks: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PricingCategoryMaxAggregateOutputType = {
    id: string | null
    circuitId: string | null
    type: string | null
    familyCategory: string | null
    minAge: number | null
    maxAge: number | null
    categoryName: string | null
    regRange: string | null
    price: number | null
    colorCode: string | null
    hexColor: string | null
    remarks: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PricingCategoryCountAggregateOutputType = {
    id: number
    circuitId: number
    type: number
    familyCategory: number
    minAge: number
    maxAge: number
    categoryName: number
    regRange: number
    price: number
    colorCode: number
    hexColor: number
    remarks: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PricingCategoryAvgAggregateInputType = {
    minAge?: true
    maxAge?: true
    price?: true
  }

  export type PricingCategorySumAggregateInputType = {
    minAge?: true
    maxAge?: true
    price?: true
  }

  export type PricingCategoryMinAggregateInputType = {
    id?: true
    circuitId?: true
    type?: true
    familyCategory?: true
    minAge?: true
    maxAge?: true
    categoryName?: true
    regRange?: true
    price?: true
    colorCode?: true
    hexColor?: true
    remarks?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PricingCategoryMaxAggregateInputType = {
    id?: true
    circuitId?: true
    type?: true
    familyCategory?: true
    minAge?: true
    maxAge?: true
    categoryName?: true
    regRange?: true
    price?: true
    colorCode?: true
    hexColor?: true
    remarks?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PricingCategoryCountAggregateInputType = {
    id?: true
    circuitId?: true
    type?: true
    familyCategory?: true
    minAge?: true
    maxAge?: true
    categoryName?: true
    regRange?: true
    price?: true
    colorCode?: true
    hexColor?: true
    remarks?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PricingCategoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PricingCategory to aggregate.
     */
    where?: PricingCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingCategories to fetch.
     */
    orderBy?: PricingCategoryOrderByWithRelationInput | PricingCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PricingCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PricingCategories
    **/
    _count?: true | PricingCategoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PricingCategoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PricingCategorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PricingCategoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PricingCategoryMaxAggregateInputType
  }

  export type GetPricingCategoryAggregateType<T extends PricingCategoryAggregateArgs> = {
        [P in keyof T & keyof AggregatePricingCategory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePricingCategory[P]>
      : GetScalarType<T[P], AggregatePricingCategory[P]>
  }




  export type PricingCategoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PricingCategoryWhereInput
    orderBy?: PricingCategoryOrderByWithAggregationInput | PricingCategoryOrderByWithAggregationInput[]
    by: PricingCategoryScalarFieldEnum[] | PricingCategoryScalarFieldEnum
    having?: PricingCategoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PricingCategoryCountAggregateInputType | true
    _avg?: PricingCategoryAvgAggregateInputType
    _sum?: PricingCategorySumAggregateInputType
    _min?: PricingCategoryMinAggregateInputType
    _max?: PricingCategoryMaxAggregateInputType
  }

  export type PricingCategoryGroupByOutputType = {
    id: string
    circuitId: string
    type: string
    familyCategory: string | null
    minAge: number | null
    maxAge: number | null
    categoryName: string
    regRange: string
    price: number
    colorCode: string
    hexColor: string
    remarks: string | null
    createdAt: Date
    updatedAt: Date
    _count: PricingCategoryCountAggregateOutputType | null
    _avg: PricingCategoryAvgAggregateOutputType | null
    _sum: PricingCategorySumAggregateOutputType | null
    _min: PricingCategoryMinAggregateOutputType | null
    _max: PricingCategoryMaxAggregateOutputType | null
  }

  type GetPricingCategoryGroupByPayload<T extends PricingCategoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PricingCategoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PricingCategoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PricingCategoryGroupByOutputType[P]>
            : GetScalarType<T[P], PricingCategoryGroupByOutputType[P]>
        }
      >
    >


  export type PricingCategorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    circuitId?: boolean
    type?: boolean
    familyCategory?: boolean
    minAge?: boolean
    maxAge?: boolean
    categoryName?: boolean
    regRange?: boolean
    price?: boolean
    colorCode?: boolean
    hexColor?: boolean
    remarks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingCategory"]>

  export type PricingCategorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    circuitId?: boolean
    type?: boolean
    familyCategory?: boolean
    minAge?: boolean
    maxAge?: boolean
    categoryName?: boolean
    regRange?: boolean
    price?: boolean
    colorCode?: boolean
    hexColor?: boolean
    remarks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingCategory"]>

  export type PricingCategorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    circuitId?: boolean
    type?: boolean
    familyCategory?: boolean
    minAge?: boolean
    maxAge?: boolean
    categoryName?: boolean
    regRange?: boolean
    price?: boolean
    colorCode?: boolean
    hexColor?: boolean
    remarks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pricingCategory"]>

  export type PricingCategorySelectScalar = {
    id?: boolean
    circuitId?: boolean
    type?: boolean
    familyCategory?: boolean
    minAge?: boolean
    maxAge?: boolean
    categoryName?: boolean
    regRange?: boolean
    price?: boolean
    colorCode?: boolean
    hexColor?: boolean
    remarks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PricingCategoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "circuitId" | "type" | "familyCategory" | "minAge" | "maxAge" | "categoryName" | "regRange" | "price" | "colorCode" | "hexColor" | "remarks" | "createdAt" | "updatedAt", ExtArgs["result"]["pricingCategory"]>

  export type $PricingCategoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PricingCategory"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      circuitId: string
      type: string
      familyCategory: string | null
      minAge: number | null
      maxAge: number | null
      categoryName: string
      regRange: string
      price: number
      colorCode: string
      hexColor: string
      remarks: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pricingCategory"]>
    composites: {}
  }

  type PricingCategoryGetPayload<S extends boolean | null | undefined | PricingCategoryDefaultArgs> = $Result.GetResult<Prisma.$PricingCategoryPayload, S>

  type PricingCategoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PricingCategoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PricingCategoryCountAggregateInputType | true
    }

  export interface PricingCategoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PricingCategory'], meta: { name: 'PricingCategory' } }
    /**
     * Find zero or one PricingCategory that matches the filter.
     * @param {PricingCategoryFindUniqueArgs} args - Arguments to find a PricingCategory
     * @example
     * // Get one PricingCategory
     * const pricingCategory = await prisma.pricingCategory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PricingCategoryFindUniqueArgs>(args: SelectSubset<T, PricingCategoryFindUniqueArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PricingCategory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PricingCategoryFindUniqueOrThrowArgs} args - Arguments to find a PricingCategory
     * @example
     * // Get one PricingCategory
     * const pricingCategory = await prisma.pricingCategory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PricingCategoryFindUniqueOrThrowArgs>(args: SelectSubset<T, PricingCategoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PricingCategory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryFindFirstArgs} args - Arguments to find a PricingCategory
     * @example
     * // Get one PricingCategory
     * const pricingCategory = await prisma.pricingCategory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PricingCategoryFindFirstArgs>(args?: SelectSubset<T, PricingCategoryFindFirstArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PricingCategory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryFindFirstOrThrowArgs} args - Arguments to find a PricingCategory
     * @example
     * // Get one PricingCategory
     * const pricingCategory = await prisma.pricingCategory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PricingCategoryFindFirstOrThrowArgs>(args?: SelectSubset<T, PricingCategoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PricingCategories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PricingCategories
     * const pricingCategories = await prisma.pricingCategory.findMany()
     * 
     * // Get first 10 PricingCategories
     * const pricingCategories = await prisma.pricingCategory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pricingCategoryWithIdOnly = await prisma.pricingCategory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PricingCategoryFindManyArgs>(args?: SelectSubset<T, PricingCategoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PricingCategory.
     * @param {PricingCategoryCreateArgs} args - Arguments to create a PricingCategory.
     * @example
     * // Create one PricingCategory
     * const PricingCategory = await prisma.pricingCategory.create({
     *   data: {
     *     // ... data to create a PricingCategory
     *   }
     * })
     * 
     */
    create<T extends PricingCategoryCreateArgs>(args: SelectSubset<T, PricingCategoryCreateArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PricingCategories.
     * @param {PricingCategoryCreateManyArgs} args - Arguments to create many PricingCategories.
     * @example
     * // Create many PricingCategories
     * const pricingCategory = await prisma.pricingCategory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PricingCategoryCreateManyArgs>(args?: SelectSubset<T, PricingCategoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PricingCategories and returns the data saved in the database.
     * @param {PricingCategoryCreateManyAndReturnArgs} args - Arguments to create many PricingCategories.
     * @example
     * // Create many PricingCategories
     * const pricingCategory = await prisma.pricingCategory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PricingCategories and only return the `id`
     * const pricingCategoryWithIdOnly = await prisma.pricingCategory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PricingCategoryCreateManyAndReturnArgs>(args?: SelectSubset<T, PricingCategoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PricingCategory.
     * @param {PricingCategoryDeleteArgs} args - Arguments to delete one PricingCategory.
     * @example
     * // Delete one PricingCategory
     * const PricingCategory = await prisma.pricingCategory.delete({
     *   where: {
     *     // ... filter to delete one PricingCategory
     *   }
     * })
     * 
     */
    delete<T extends PricingCategoryDeleteArgs>(args: SelectSubset<T, PricingCategoryDeleteArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PricingCategory.
     * @param {PricingCategoryUpdateArgs} args - Arguments to update one PricingCategory.
     * @example
     * // Update one PricingCategory
     * const pricingCategory = await prisma.pricingCategory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PricingCategoryUpdateArgs>(args: SelectSubset<T, PricingCategoryUpdateArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PricingCategories.
     * @param {PricingCategoryDeleteManyArgs} args - Arguments to filter PricingCategories to delete.
     * @example
     * // Delete a few PricingCategories
     * const { count } = await prisma.pricingCategory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PricingCategoryDeleteManyArgs>(args?: SelectSubset<T, PricingCategoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PricingCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PricingCategories
     * const pricingCategory = await prisma.pricingCategory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PricingCategoryUpdateManyArgs>(args: SelectSubset<T, PricingCategoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PricingCategories and returns the data updated in the database.
     * @param {PricingCategoryUpdateManyAndReturnArgs} args - Arguments to update many PricingCategories.
     * @example
     * // Update many PricingCategories
     * const pricingCategory = await prisma.pricingCategory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PricingCategories and only return the `id`
     * const pricingCategoryWithIdOnly = await prisma.pricingCategory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PricingCategoryUpdateManyAndReturnArgs>(args: SelectSubset<T, PricingCategoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PricingCategory.
     * @param {PricingCategoryUpsertArgs} args - Arguments to update or create a PricingCategory.
     * @example
     * // Update or create a PricingCategory
     * const pricingCategory = await prisma.pricingCategory.upsert({
     *   create: {
     *     // ... data to create a PricingCategory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PricingCategory we want to update
     *   }
     * })
     */
    upsert<T extends PricingCategoryUpsertArgs>(args: SelectSubset<T, PricingCategoryUpsertArgs<ExtArgs>>): Prisma__PricingCategoryClient<$Result.GetResult<Prisma.$PricingCategoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PricingCategories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryCountArgs} args - Arguments to filter PricingCategories to count.
     * @example
     * // Count the number of PricingCategories
     * const count = await prisma.pricingCategory.count({
     *   where: {
     *     // ... the filter for the PricingCategories we want to count
     *   }
     * })
    **/
    count<T extends PricingCategoryCountArgs>(
      args?: Subset<T, PricingCategoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PricingCategoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PricingCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PricingCategoryAggregateArgs>(args: Subset<T, PricingCategoryAggregateArgs>): Prisma.PrismaPromise<GetPricingCategoryAggregateType<T>>

    /**
     * Group by PricingCategory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PricingCategoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PricingCategoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PricingCategoryGroupByArgs['orderBy'] }
        : { orderBy?: PricingCategoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PricingCategoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPricingCategoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PricingCategory model
   */
  readonly fields: PricingCategoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PricingCategory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PricingCategoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PricingCategory model
   */
  interface PricingCategoryFieldRefs {
    readonly id: FieldRef<"PricingCategory", 'String'>
    readonly circuitId: FieldRef<"PricingCategory", 'String'>
    readonly type: FieldRef<"PricingCategory", 'String'>
    readonly familyCategory: FieldRef<"PricingCategory", 'String'>
    readonly minAge: FieldRef<"PricingCategory", 'Int'>
    readonly maxAge: FieldRef<"PricingCategory", 'Int'>
    readonly categoryName: FieldRef<"PricingCategory", 'String'>
    readonly regRange: FieldRef<"PricingCategory", 'String'>
    readonly price: FieldRef<"PricingCategory", 'Float'>
    readonly colorCode: FieldRef<"PricingCategory", 'String'>
    readonly hexColor: FieldRef<"PricingCategory", 'String'>
    readonly remarks: FieldRef<"PricingCategory", 'String'>
    readonly createdAt: FieldRef<"PricingCategory", 'DateTime'>
    readonly updatedAt: FieldRef<"PricingCategory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PricingCategory findUnique
   */
  export type PricingCategoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * Filter, which PricingCategory to fetch.
     */
    where: PricingCategoryWhereUniqueInput
  }

  /**
   * PricingCategory findUniqueOrThrow
   */
  export type PricingCategoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * Filter, which PricingCategory to fetch.
     */
    where: PricingCategoryWhereUniqueInput
  }

  /**
   * PricingCategory findFirst
   */
  export type PricingCategoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * Filter, which PricingCategory to fetch.
     */
    where?: PricingCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingCategories to fetch.
     */
    orderBy?: PricingCategoryOrderByWithRelationInput | PricingCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PricingCategories.
     */
    cursor?: PricingCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingCategories.
     */
    distinct?: PricingCategoryScalarFieldEnum | PricingCategoryScalarFieldEnum[]
  }

  /**
   * PricingCategory findFirstOrThrow
   */
  export type PricingCategoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * Filter, which PricingCategory to fetch.
     */
    where?: PricingCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingCategories to fetch.
     */
    orderBy?: PricingCategoryOrderByWithRelationInput | PricingCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PricingCategories.
     */
    cursor?: PricingCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingCategories.
     */
    distinct?: PricingCategoryScalarFieldEnum | PricingCategoryScalarFieldEnum[]
  }

  /**
   * PricingCategory findMany
   */
  export type PricingCategoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * Filter, which PricingCategories to fetch.
     */
    where?: PricingCategoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PricingCategories to fetch.
     */
    orderBy?: PricingCategoryOrderByWithRelationInput | PricingCategoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PricingCategories.
     */
    cursor?: PricingCategoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PricingCategories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PricingCategories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PricingCategories.
     */
    distinct?: PricingCategoryScalarFieldEnum | PricingCategoryScalarFieldEnum[]
  }

  /**
   * PricingCategory create
   */
  export type PricingCategoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * The data needed to create a PricingCategory.
     */
    data: XOR<PricingCategoryCreateInput, PricingCategoryUncheckedCreateInput>
  }

  /**
   * PricingCategory createMany
   */
  export type PricingCategoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PricingCategories.
     */
    data: PricingCategoryCreateManyInput | PricingCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PricingCategory createManyAndReturn
   */
  export type PricingCategoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * The data used to create many PricingCategories.
     */
    data: PricingCategoryCreateManyInput | PricingCategoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PricingCategory update
   */
  export type PricingCategoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * The data needed to update a PricingCategory.
     */
    data: XOR<PricingCategoryUpdateInput, PricingCategoryUncheckedUpdateInput>
    /**
     * Choose, which PricingCategory to update.
     */
    where: PricingCategoryWhereUniqueInput
  }

  /**
   * PricingCategory updateMany
   */
  export type PricingCategoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PricingCategories.
     */
    data: XOR<PricingCategoryUpdateManyMutationInput, PricingCategoryUncheckedUpdateManyInput>
    /**
     * Filter which PricingCategories to update
     */
    where?: PricingCategoryWhereInput
    /**
     * Limit how many PricingCategories to update.
     */
    limit?: number
  }

  /**
   * PricingCategory updateManyAndReturn
   */
  export type PricingCategoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * The data used to update PricingCategories.
     */
    data: XOR<PricingCategoryUpdateManyMutationInput, PricingCategoryUncheckedUpdateManyInput>
    /**
     * Filter which PricingCategories to update
     */
    where?: PricingCategoryWhereInput
    /**
     * Limit how many PricingCategories to update.
     */
    limit?: number
  }

  /**
   * PricingCategory upsert
   */
  export type PricingCategoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * The filter to search for the PricingCategory to update in case it exists.
     */
    where: PricingCategoryWhereUniqueInput
    /**
     * In case the PricingCategory found by the `where` argument doesn't exist, create a new PricingCategory with this data.
     */
    create: XOR<PricingCategoryCreateInput, PricingCategoryUncheckedCreateInput>
    /**
     * In case the PricingCategory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PricingCategoryUpdateInput, PricingCategoryUncheckedUpdateInput>
  }

  /**
   * PricingCategory delete
   */
  export type PricingCategoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
    /**
     * Filter which PricingCategory to delete.
     */
    where: PricingCategoryWhereUniqueInput
  }

  /**
   * PricingCategory deleteMany
   */
  export type PricingCategoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PricingCategories to delete
     */
    where?: PricingCategoryWhereInput
    /**
     * Limit how many PricingCategories to delete.
     */
    limit?: number
  }

  /**
   * PricingCategory without action
   */
  export type PricingCategoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PricingCategory
     */
    select?: PricingCategorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PricingCategory
     */
    omit?: PricingCategoryOmit<ExtArgs> | null
  }


  /**
   * Model EmailLog
   */

  export type AggregateEmailLog = {
    _count: EmailLogCountAggregateOutputType | null
    _min: EmailLogMinAggregateOutputType | null
    _max: EmailLogMaxAggregateOutputType | null
  }

  export type EmailLogMinAggregateOutputType = {
    id: string | null
    registrationId: string | null
    type: string | null
    sentAt: Date | null
    status: string | null
    error: string | null
  }

  export type EmailLogMaxAggregateOutputType = {
    id: string | null
    registrationId: string | null
    type: string | null
    sentAt: Date | null
    status: string | null
    error: string | null
  }

  export type EmailLogCountAggregateOutputType = {
    id: number
    registrationId: number
    type: number
    sentAt: number
    status: number
    error: number
    _all: number
  }


  export type EmailLogMinAggregateInputType = {
    id?: true
    registrationId?: true
    type?: true
    sentAt?: true
    status?: true
    error?: true
  }

  export type EmailLogMaxAggregateInputType = {
    id?: true
    registrationId?: true
    type?: true
    sentAt?: true
    status?: true
    error?: true
  }

  export type EmailLogCountAggregateInputType = {
    id?: true
    registrationId?: true
    type?: true
    sentAt?: true
    status?: true
    error?: true
    _all?: true
  }

  export type EmailLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailLog to aggregate.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EmailLogs
    **/
    _count?: true | EmailLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EmailLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EmailLogMaxAggregateInputType
  }

  export type GetEmailLogAggregateType<T extends EmailLogAggregateArgs> = {
        [P in keyof T & keyof AggregateEmailLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmailLog[P]>
      : GetScalarType<T[P], AggregateEmailLog[P]>
  }




  export type EmailLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailLogWhereInput
    orderBy?: EmailLogOrderByWithAggregationInput | EmailLogOrderByWithAggregationInput[]
    by: EmailLogScalarFieldEnum[] | EmailLogScalarFieldEnum
    having?: EmailLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmailLogCountAggregateInputType | true
    _min?: EmailLogMinAggregateInputType
    _max?: EmailLogMaxAggregateInputType
  }

  export type EmailLogGroupByOutputType = {
    id: string
    registrationId: string
    type: string
    sentAt: Date
    status: string
    error: string | null
    _count: EmailLogCountAggregateOutputType | null
    _min: EmailLogMinAggregateOutputType | null
    _max: EmailLogMaxAggregateOutputType | null
  }

  type GetEmailLogGroupByPayload<T extends EmailLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EmailLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EmailLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmailLogGroupByOutputType[P]>
            : GetScalarType<T[P], EmailLogGroupByOutputType[P]>
        }
      >
    >


  export type EmailLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    type?: boolean
    sentAt?: boolean
    status?: boolean
    error?: boolean
  }, ExtArgs["result"]["emailLog"]>

  export type EmailLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    type?: boolean
    sentAt?: boolean
    status?: boolean
    error?: boolean
  }, ExtArgs["result"]["emailLog"]>

  export type EmailLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    type?: boolean
    sentAt?: boolean
    status?: boolean
    error?: boolean
  }, ExtArgs["result"]["emailLog"]>

  export type EmailLogSelectScalar = {
    id?: boolean
    registrationId?: boolean
    type?: boolean
    sentAt?: boolean
    status?: boolean
    error?: boolean
  }

  export type EmailLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "registrationId" | "type" | "sentAt" | "status" | "error", ExtArgs["result"]["emailLog"]>

  export type $EmailLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EmailLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      registrationId: string
      type: string
      sentAt: Date
      status: string
      error: string | null
    }, ExtArgs["result"]["emailLog"]>
    composites: {}
  }

  type EmailLogGetPayload<S extends boolean | null | undefined | EmailLogDefaultArgs> = $Result.GetResult<Prisma.$EmailLogPayload, S>

  type EmailLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EmailLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EmailLogCountAggregateInputType | true
    }

  export interface EmailLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EmailLog'], meta: { name: 'EmailLog' } }
    /**
     * Find zero or one EmailLog that matches the filter.
     * @param {EmailLogFindUniqueArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmailLogFindUniqueArgs>(args: SelectSubset<T, EmailLogFindUniqueArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EmailLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmailLogFindUniqueOrThrowArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmailLogFindUniqueOrThrowArgs>(args: SelectSubset<T, EmailLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogFindFirstArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmailLogFindFirstArgs>(args?: SelectSubset<T, EmailLogFindFirstArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogFindFirstOrThrowArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmailLogFindFirstOrThrowArgs>(args?: SelectSubset<T, EmailLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EmailLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EmailLogs
     * const emailLogs = await prisma.emailLog.findMany()
     * 
     * // Get first 10 EmailLogs
     * const emailLogs = await prisma.emailLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const emailLogWithIdOnly = await prisma.emailLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EmailLogFindManyArgs>(args?: SelectSubset<T, EmailLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EmailLog.
     * @param {EmailLogCreateArgs} args - Arguments to create a EmailLog.
     * @example
     * // Create one EmailLog
     * const EmailLog = await prisma.emailLog.create({
     *   data: {
     *     // ... data to create a EmailLog
     *   }
     * })
     * 
     */
    create<T extends EmailLogCreateArgs>(args: SelectSubset<T, EmailLogCreateArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EmailLogs.
     * @param {EmailLogCreateManyArgs} args - Arguments to create many EmailLogs.
     * @example
     * // Create many EmailLogs
     * const emailLog = await prisma.emailLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EmailLogCreateManyArgs>(args?: SelectSubset<T, EmailLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EmailLogs and returns the data saved in the database.
     * @param {EmailLogCreateManyAndReturnArgs} args - Arguments to create many EmailLogs.
     * @example
     * // Create many EmailLogs
     * const emailLog = await prisma.emailLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EmailLogs and only return the `id`
     * const emailLogWithIdOnly = await prisma.emailLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EmailLogCreateManyAndReturnArgs>(args?: SelectSubset<T, EmailLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EmailLog.
     * @param {EmailLogDeleteArgs} args - Arguments to delete one EmailLog.
     * @example
     * // Delete one EmailLog
     * const EmailLog = await prisma.emailLog.delete({
     *   where: {
     *     // ... filter to delete one EmailLog
     *   }
     * })
     * 
     */
    delete<T extends EmailLogDeleteArgs>(args: SelectSubset<T, EmailLogDeleteArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EmailLog.
     * @param {EmailLogUpdateArgs} args - Arguments to update one EmailLog.
     * @example
     * // Update one EmailLog
     * const emailLog = await prisma.emailLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EmailLogUpdateArgs>(args: SelectSubset<T, EmailLogUpdateArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EmailLogs.
     * @param {EmailLogDeleteManyArgs} args - Arguments to filter EmailLogs to delete.
     * @example
     * // Delete a few EmailLogs
     * const { count } = await prisma.emailLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EmailLogDeleteManyArgs>(args?: SelectSubset<T, EmailLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EmailLogs
     * const emailLog = await prisma.emailLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EmailLogUpdateManyArgs>(args: SelectSubset<T, EmailLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailLogs and returns the data updated in the database.
     * @param {EmailLogUpdateManyAndReturnArgs} args - Arguments to update many EmailLogs.
     * @example
     * // Update many EmailLogs
     * const emailLog = await prisma.emailLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EmailLogs and only return the `id`
     * const emailLogWithIdOnly = await prisma.emailLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EmailLogUpdateManyAndReturnArgs>(args: SelectSubset<T, EmailLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EmailLog.
     * @param {EmailLogUpsertArgs} args - Arguments to update or create a EmailLog.
     * @example
     * // Update or create a EmailLog
     * const emailLog = await prisma.emailLog.upsert({
     *   create: {
     *     // ... data to create a EmailLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EmailLog we want to update
     *   }
     * })
     */
    upsert<T extends EmailLogUpsertArgs>(args: SelectSubset<T, EmailLogUpsertArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EmailLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogCountArgs} args - Arguments to filter EmailLogs to count.
     * @example
     * // Count the number of EmailLogs
     * const count = await prisma.emailLog.count({
     *   where: {
     *     // ... the filter for the EmailLogs we want to count
     *   }
     * })
    **/
    count<T extends EmailLogCountArgs>(
      args?: Subset<T, EmailLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmailLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EmailLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EmailLogAggregateArgs>(args: Subset<T, EmailLogAggregateArgs>): Prisma.PrismaPromise<GetEmailLogAggregateType<T>>

    /**
     * Group by EmailLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EmailLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmailLogGroupByArgs['orderBy'] }
        : { orderBy?: EmailLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EmailLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmailLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EmailLog model
   */
  readonly fields: EmailLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EmailLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmailLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EmailLog model
   */
  interface EmailLogFieldRefs {
    readonly id: FieldRef<"EmailLog", 'String'>
    readonly registrationId: FieldRef<"EmailLog", 'String'>
    readonly type: FieldRef<"EmailLog", 'String'>
    readonly sentAt: FieldRef<"EmailLog", 'DateTime'>
    readonly status: FieldRef<"EmailLog", 'String'>
    readonly error: FieldRef<"EmailLog", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EmailLog findUnique
   */
  export type EmailLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog findUniqueOrThrow
   */
  export type EmailLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog findFirst
   */
  export type EmailLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailLogs.
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailLogs.
     */
    distinct?: EmailLogScalarFieldEnum | EmailLogScalarFieldEnum[]
  }

  /**
   * EmailLog findFirstOrThrow
   */
  export type EmailLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailLogs.
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailLogs.
     */
    distinct?: EmailLogScalarFieldEnum | EmailLogScalarFieldEnum[]
  }

  /**
   * EmailLog findMany
   */
  export type EmailLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLogs to fetch.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EmailLogs.
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailLogs.
     */
    distinct?: EmailLogScalarFieldEnum | EmailLogScalarFieldEnum[]
  }

  /**
   * EmailLog create
   */
  export type EmailLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data needed to create a EmailLog.
     */
    data: XOR<EmailLogCreateInput, EmailLogUncheckedCreateInput>
  }

  /**
   * EmailLog createMany
   */
  export type EmailLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EmailLogs.
     */
    data: EmailLogCreateManyInput | EmailLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailLog createManyAndReturn
   */
  export type EmailLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data used to create many EmailLogs.
     */
    data: EmailLogCreateManyInput | EmailLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailLog update
   */
  export type EmailLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data needed to update a EmailLog.
     */
    data: XOR<EmailLogUpdateInput, EmailLogUncheckedUpdateInput>
    /**
     * Choose, which EmailLog to update.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog updateMany
   */
  export type EmailLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EmailLogs.
     */
    data: XOR<EmailLogUpdateManyMutationInput, EmailLogUncheckedUpdateManyInput>
    /**
     * Filter which EmailLogs to update
     */
    where?: EmailLogWhereInput
    /**
     * Limit how many EmailLogs to update.
     */
    limit?: number
  }

  /**
   * EmailLog updateManyAndReturn
   */
  export type EmailLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data used to update EmailLogs.
     */
    data: XOR<EmailLogUpdateManyMutationInput, EmailLogUncheckedUpdateManyInput>
    /**
     * Filter which EmailLogs to update
     */
    where?: EmailLogWhereInput
    /**
     * Limit how many EmailLogs to update.
     */
    limit?: number
  }

  /**
   * EmailLog upsert
   */
  export type EmailLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The filter to search for the EmailLog to update in case it exists.
     */
    where: EmailLogWhereUniqueInput
    /**
     * In case the EmailLog found by the `where` argument doesn't exist, create a new EmailLog with this data.
     */
    create: XOR<EmailLogCreateInput, EmailLogUncheckedCreateInput>
    /**
     * In case the EmailLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmailLogUpdateInput, EmailLogUncheckedUpdateInput>
  }

  /**
   * EmailLog delete
   */
  export type EmailLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter which EmailLog to delete.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog deleteMany
   */
  export type EmailLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailLogs to delete
     */
    where?: EmailLogWhereInput
    /**
     * Limit how many EmailLogs to delete.
     */
    limit?: number
  }

  /**
   * EmailLog without action
   */
  export type EmailLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
  }


  /**
   * Model RaffleTicket
   */

  export type AggregateRaffleTicket = {
    _count: RaffleTicketCountAggregateOutputType | null
    _min: RaffleTicketMinAggregateOutputType | null
    _max: RaffleTicketMaxAggregateOutputType | null
  }

  export type RaffleTicketMinAggregateOutputType = {
    id: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phoneNumber: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    checkoutRequestId: string | null
    paymentFailed: boolean | null
    gender: string | null
    idNumber: string | null
    failureReason: string | null
    mpesaCode: string | null
    referralCode: string | null
  }

  export type RaffleTicketMaxAggregateOutputType = {
    id: string | null
    firstName: string | null
    lastName: string | null
    email: string | null
    phoneNumber: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
    checkoutRequestId: string | null
    paymentFailed: boolean | null
    gender: string | null
    idNumber: string | null
    failureReason: string | null
    mpesaCode: string | null
    referralCode: string | null
  }

  export type RaffleTicketCountAggregateOutputType = {
    id: number
    firstName: number
    lastName: number
    email: number
    phoneNumber: number
    status: number
    createdAt: number
    updatedAt: number
    checkoutRequestId: number
    paymentFailed: number
    gender: number
    idNumber: number
    failureReason: number
    mpesaCode: number
    paymentDetails: number
    referralCode: number
    _all: number
  }


  export type RaffleTicketMinAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    email?: true
    phoneNumber?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    checkoutRequestId?: true
    paymentFailed?: true
    gender?: true
    idNumber?: true
    failureReason?: true
    mpesaCode?: true
    referralCode?: true
  }

  export type RaffleTicketMaxAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    email?: true
    phoneNumber?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    checkoutRequestId?: true
    paymentFailed?: true
    gender?: true
    idNumber?: true
    failureReason?: true
    mpesaCode?: true
    referralCode?: true
  }

  export type RaffleTicketCountAggregateInputType = {
    id?: true
    firstName?: true
    lastName?: true
    email?: true
    phoneNumber?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    checkoutRequestId?: true
    paymentFailed?: true
    gender?: true
    idNumber?: true
    failureReason?: true
    mpesaCode?: true
    paymentDetails?: true
    referralCode?: true
    _all?: true
  }

  export type RaffleTicketAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RaffleTicket to aggregate.
     */
    where?: RaffleTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RaffleTickets to fetch.
     */
    orderBy?: RaffleTicketOrderByWithRelationInput | RaffleTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RaffleTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RaffleTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RaffleTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned RaffleTickets
    **/
    _count?: true | RaffleTicketCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RaffleTicketMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RaffleTicketMaxAggregateInputType
  }

  export type GetRaffleTicketAggregateType<T extends RaffleTicketAggregateArgs> = {
        [P in keyof T & keyof AggregateRaffleTicket]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRaffleTicket[P]>
      : GetScalarType<T[P], AggregateRaffleTicket[P]>
  }




  export type RaffleTicketGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RaffleTicketWhereInput
    orderBy?: RaffleTicketOrderByWithAggregationInput | RaffleTicketOrderByWithAggregationInput[]
    by: RaffleTicketScalarFieldEnum[] | RaffleTicketScalarFieldEnum
    having?: RaffleTicketScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RaffleTicketCountAggregateInputType | true
    _min?: RaffleTicketMinAggregateInputType
    _max?: RaffleTicketMaxAggregateInputType
  }

  export type RaffleTicketGroupByOutputType = {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    checkoutRequestId: string | null
    paymentFailed: boolean
    gender: string | null
    idNumber: string | null
    failureReason: string | null
    mpesaCode: string | null
    paymentDetails: JsonValue | null
    referralCode: string | null
    _count: RaffleTicketCountAggregateOutputType | null
    _min: RaffleTicketMinAggregateOutputType | null
    _max: RaffleTicketMaxAggregateOutputType | null
  }

  type GetRaffleTicketGroupByPayload<T extends RaffleTicketGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RaffleTicketGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RaffleTicketGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RaffleTicketGroupByOutputType[P]>
            : GetScalarType<T[P], RaffleTicketGroupByOutputType[P]>
        }
      >
    >


  export type RaffleTicketSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    checkoutRequestId?: boolean
    paymentFailed?: boolean
    gender?: boolean
    idNumber?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
    referralCode?: boolean
  }, ExtArgs["result"]["raffleTicket"]>

  export type RaffleTicketSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    checkoutRequestId?: boolean
    paymentFailed?: boolean
    gender?: boolean
    idNumber?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
    referralCode?: boolean
  }, ExtArgs["result"]["raffleTicket"]>

  export type RaffleTicketSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    checkoutRequestId?: boolean
    paymentFailed?: boolean
    gender?: boolean
    idNumber?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
    referralCode?: boolean
  }, ExtArgs["result"]["raffleTicket"]>

  export type RaffleTicketSelectScalar = {
    id?: boolean
    firstName?: boolean
    lastName?: boolean
    email?: boolean
    phoneNumber?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    checkoutRequestId?: boolean
    paymentFailed?: boolean
    gender?: boolean
    idNumber?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
    referralCode?: boolean
  }

  export type RaffleTicketOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "firstName" | "lastName" | "email" | "phoneNumber" | "status" | "createdAt" | "updatedAt" | "checkoutRequestId" | "paymentFailed" | "gender" | "idNumber" | "failureReason" | "mpesaCode" | "paymentDetails" | "referralCode", ExtArgs["result"]["raffleTicket"]>

  export type $RaffleTicketPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "RaffleTicket"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      firstName: string
      lastName: string
      email: string
      phoneNumber: string | null
      status: string
      createdAt: Date
      updatedAt: Date
      checkoutRequestId: string | null
      paymentFailed: boolean
      gender: string | null
      idNumber: string | null
      failureReason: string | null
      mpesaCode: string | null
      paymentDetails: Prisma.JsonValue | null
      referralCode: string | null
    }, ExtArgs["result"]["raffleTicket"]>
    composites: {}
  }

  type RaffleTicketGetPayload<S extends boolean | null | undefined | RaffleTicketDefaultArgs> = $Result.GetResult<Prisma.$RaffleTicketPayload, S>

  type RaffleTicketCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RaffleTicketFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RaffleTicketCountAggregateInputType | true
    }

  export interface RaffleTicketDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['RaffleTicket'], meta: { name: 'RaffleTicket' } }
    /**
     * Find zero or one RaffleTicket that matches the filter.
     * @param {RaffleTicketFindUniqueArgs} args - Arguments to find a RaffleTicket
     * @example
     * // Get one RaffleTicket
     * const raffleTicket = await prisma.raffleTicket.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RaffleTicketFindUniqueArgs>(args: SelectSubset<T, RaffleTicketFindUniqueArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one RaffleTicket that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RaffleTicketFindUniqueOrThrowArgs} args - Arguments to find a RaffleTicket
     * @example
     * // Get one RaffleTicket
     * const raffleTicket = await prisma.raffleTicket.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RaffleTicketFindUniqueOrThrowArgs>(args: SelectSubset<T, RaffleTicketFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RaffleTicket that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketFindFirstArgs} args - Arguments to find a RaffleTicket
     * @example
     * // Get one RaffleTicket
     * const raffleTicket = await prisma.raffleTicket.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RaffleTicketFindFirstArgs>(args?: SelectSubset<T, RaffleTicketFindFirstArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first RaffleTicket that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketFindFirstOrThrowArgs} args - Arguments to find a RaffleTicket
     * @example
     * // Get one RaffleTicket
     * const raffleTicket = await prisma.raffleTicket.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RaffleTicketFindFirstOrThrowArgs>(args?: SelectSubset<T, RaffleTicketFindFirstOrThrowArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more RaffleTickets that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all RaffleTickets
     * const raffleTickets = await prisma.raffleTicket.findMany()
     * 
     * // Get first 10 RaffleTickets
     * const raffleTickets = await prisma.raffleTicket.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const raffleTicketWithIdOnly = await prisma.raffleTicket.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RaffleTicketFindManyArgs>(args?: SelectSubset<T, RaffleTicketFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a RaffleTicket.
     * @param {RaffleTicketCreateArgs} args - Arguments to create a RaffleTicket.
     * @example
     * // Create one RaffleTicket
     * const RaffleTicket = await prisma.raffleTicket.create({
     *   data: {
     *     // ... data to create a RaffleTicket
     *   }
     * })
     * 
     */
    create<T extends RaffleTicketCreateArgs>(args: SelectSubset<T, RaffleTicketCreateArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many RaffleTickets.
     * @param {RaffleTicketCreateManyArgs} args - Arguments to create many RaffleTickets.
     * @example
     * // Create many RaffleTickets
     * const raffleTicket = await prisma.raffleTicket.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RaffleTicketCreateManyArgs>(args?: SelectSubset<T, RaffleTicketCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many RaffleTickets and returns the data saved in the database.
     * @param {RaffleTicketCreateManyAndReturnArgs} args - Arguments to create many RaffleTickets.
     * @example
     * // Create many RaffleTickets
     * const raffleTicket = await prisma.raffleTicket.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many RaffleTickets and only return the `id`
     * const raffleTicketWithIdOnly = await prisma.raffleTicket.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RaffleTicketCreateManyAndReturnArgs>(args?: SelectSubset<T, RaffleTicketCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a RaffleTicket.
     * @param {RaffleTicketDeleteArgs} args - Arguments to delete one RaffleTicket.
     * @example
     * // Delete one RaffleTicket
     * const RaffleTicket = await prisma.raffleTicket.delete({
     *   where: {
     *     // ... filter to delete one RaffleTicket
     *   }
     * })
     * 
     */
    delete<T extends RaffleTicketDeleteArgs>(args: SelectSubset<T, RaffleTicketDeleteArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one RaffleTicket.
     * @param {RaffleTicketUpdateArgs} args - Arguments to update one RaffleTicket.
     * @example
     * // Update one RaffleTicket
     * const raffleTicket = await prisma.raffleTicket.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RaffleTicketUpdateArgs>(args: SelectSubset<T, RaffleTicketUpdateArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more RaffleTickets.
     * @param {RaffleTicketDeleteManyArgs} args - Arguments to filter RaffleTickets to delete.
     * @example
     * // Delete a few RaffleTickets
     * const { count } = await prisma.raffleTicket.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RaffleTicketDeleteManyArgs>(args?: SelectSubset<T, RaffleTicketDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RaffleTickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many RaffleTickets
     * const raffleTicket = await prisma.raffleTicket.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RaffleTicketUpdateManyArgs>(args: SelectSubset<T, RaffleTicketUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more RaffleTickets and returns the data updated in the database.
     * @param {RaffleTicketUpdateManyAndReturnArgs} args - Arguments to update many RaffleTickets.
     * @example
     * // Update many RaffleTickets
     * const raffleTicket = await prisma.raffleTicket.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more RaffleTickets and only return the `id`
     * const raffleTicketWithIdOnly = await prisma.raffleTicket.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RaffleTicketUpdateManyAndReturnArgs>(args: SelectSubset<T, RaffleTicketUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one RaffleTicket.
     * @param {RaffleTicketUpsertArgs} args - Arguments to update or create a RaffleTicket.
     * @example
     * // Update or create a RaffleTicket
     * const raffleTicket = await prisma.raffleTicket.upsert({
     *   create: {
     *     // ... data to create a RaffleTicket
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the RaffleTicket we want to update
     *   }
     * })
     */
    upsert<T extends RaffleTicketUpsertArgs>(args: SelectSubset<T, RaffleTicketUpsertArgs<ExtArgs>>): Prisma__RaffleTicketClient<$Result.GetResult<Prisma.$RaffleTicketPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of RaffleTickets.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketCountArgs} args - Arguments to filter RaffleTickets to count.
     * @example
     * // Count the number of RaffleTickets
     * const count = await prisma.raffleTicket.count({
     *   where: {
     *     // ... the filter for the RaffleTickets we want to count
     *   }
     * })
    **/
    count<T extends RaffleTicketCountArgs>(
      args?: Subset<T, RaffleTicketCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RaffleTicketCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a RaffleTicket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RaffleTicketAggregateArgs>(args: Subset<T, RaffleTicketAggregateArgs>): Prisma.PrismaPromise<GetRaffleTicketAggregateType<T>>

    /**
     * Group by RaffleTicket.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RaffleTicketGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RaffleTicketGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RaffleTicketGroupByArgs['orderBy'] }
        : { orderBy?: RaffleTicketGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RaffleTicketGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRaffleTicketGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the RaffleTicket model
   */
  readonly fields: RaffleTicketFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for RaffleTicket.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RaffleTicketClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the RaffleTicket model
   */
  interface RaffleTicketFieldRefs {
    readonly id: FieldRef<"RaffleTicket", 'String'>
    readonly firstName: FieldRef<"RaffleTicket", 'String'>
    readonly lastName: FieldRef<"RaffleTicket", 'String'>
    readonly email: FieldRef<"RaffleTicket", 'String'>
    readonly phoneNumber: FieldRef<"RaffleTicket", 'String'>
    readonly status: FieldRef<"RaffleTicket", 'String'>
    readonly createdAt: FieldRef<"RaffleTicket", 'DateTime'>
    readonly updatedAt: FieldRef<"RaffleTicket", 'DateTime'>
    readonly checkoutRequestId: FieldRef<"RaffleTicket", 'String'>
    readonly paymentFailed: FieldRef<"RaffleTicket", 'Boolean'>
    readonly gender: FieldRef<"RaffleTicket", 'String'>
    readonly idNumber: FieldRef<"RaffleTicket", 'String'>
    readonly failureReason: FieldRef<"RaffleTicket", 'String'>
    readonly mpesaCode: FieldRef<"RaffleTicket", 'String'>
    readonly paymentDetails: FieldRef<"RaffleTicket", 'Json'>
    readonly referralCode: FieldRef<"RaffleTicket", 'String'>
  }
    

  // Custom InputTypes
  /**
   * RaffleTicket findUnique
   */
  export type RaffleTicketFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * Filter, which RaffleTicket to fetch.
     */
    where: RaffleTicketWhereUniqueInput
  }

  /**
   * RaffleTicket findUniqueOrThrow
   */
  export type RaffleTicketFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * Filter, which RaffleTicket to fetch.
     */
    where: RaffleTicketWhereUniqueInput
  }

  /**
   * RaffleTicket findFirst
   */
  export type RaffleTicketFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * Filter, which RaffleTicket to fetch.
     */
    where?: RaffleTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RaffleTickets to fetch.
     */
    orderBy?: RaffleTicketOrderByWithRelationInput | RaffleTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RaffleTickets.
     */
    cursor?: RaffleTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RaffleTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RaffleTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RaffleTickets.
     */
    distinct?: RaffleTicketScalarFieldEnum | RaffleTicketScalarFieldEnum[]
  }

  /**
   * RaffleTicket findFirstOrThrow
   */
  export type RaffleTicketFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * Filter, which RaffleTicket to fetch.
     */
    where?: RaffleTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RaffleTickets to fetch.
     */
    orderBy?: RaffleTicketOrderByWithRelationInput | RaffleTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for RaffleTickets.
     */
    cursor?: RaffleTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RaffleTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RaffleTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RaffleTickets.
     */
    distinct?: RaffleTicketScalarFieldEnum | RaffleTicketScalarFieldEnum[]
  }

  /**
   * RaffleTicket findMany
   */
  export type RaffleTicketFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * Filter, which RaffleTickets to fetch.
     */
    where?: RaffleTicketWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of RaffleTickets to fetch.
     */
    orderBy?: RaffleTicketOrderByWithRelationInput | RaffleTicketOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing RaffleTickets.
     */
    cursor?: RaffleTicketWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` RaffleTickets from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` RaffleTickets.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of RaffleTickets.
     */
    distinct?: RaffleTicketScalarFieldEnum | RaffleTicketScalarFieldEnum[]
  }

  /**
   * RaffleTicket create
   */
  export type RaffleTicketCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * The data needed to create a RaffleTicket.
     */
    data: XOR<RaffleTicketCreateInput, RaffleTicketUncheckedCreateInput>
  }

  /**
   * RaffleTicket createMany
   */
  export type RaffleTicketCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many RaffleTickets.
     */
    data: RaffleTicketCreateManyInput | RaffleTicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RaffleTicket createManyAndReturn
   */
  export type RaffleTicketCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * The data used to create many RaffleTickets.
     */
    data: RaffleTicketCreateManyInput | RaffleTicketCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * RaffleTicket update
   */
  export type RaffleTicketUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * The data needed to update a RaffleTicket.
     */
    data: XOR<RaffleTicketUpdateInput, RaffleTicketUncheckedUpdateInput>
    /**
     * Choose, which RaffleTicket to update.
     */
    where: RaffleTicketWhereUniqueInput
  }

  /**
   * RaffleTicket updateMany
   */
  export type RaffleTicketUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update RaffleTickets.
     */
    data: XOR<RaffleTicketUpdateManyMutationInput, RaffleTicketUncheckedUpdateManyInput>
    /**
     * Filter which RaffleTickets to update
     */
    where?: RaffleTicketWhereInput
    /**
     * Limit how many RaffleTickets to update.
     */
    limit?: number
  }

  /**
   * RaffleTicket updateManyAndReturn
   */
  export type RaffleTicketUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * The data used to update RaffleTickets.
     */
    data: XOR<RaffleTicketUpdateManyMutationInput, RaffleTicketUncheckedUpdateManyInput>
    /**
     * Filter which RaffleTickets to update
     */
    where?: RaffleTicketWhereInput
    /**
     * Limit how many RaffleTickets to update.
     */
    limit?: number
  }

  /**
   * RaffleTicket upsert
   */
  export type RaffleTicketUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * The filter to search for the RaffleTicket to update in case it exists.
     */
    where: RaffleTicketWhereUniqueInput
    /**
     * In case the RaffleTicket found by the `where` argument doesn't exist, create a new RaffleTicket with this data.
     */
    create: XOR<RaffleTicketCreateInput, RaffleTicketUncheckedCreateInput>
    /**
     * In case the RaffleTicket was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RaffleTicketUpdateInput, RaffleTicketUncheckedUpdateInput>
  }

  /**
   * RaffleTicket delete
   */
  export type RaffleTicketDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
    /**
     * Filter which RaffleTicket to delete.
     */
    where: RaffleTicketWhereUniqueInput
  }

  /**
   * RaffleTicket deleteMany
   */
  export type RaffleTicketDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which RaffleTickets to delete
     */
    where?: RaffleTicketWhereInput
    /**
     * Limit how many RaffleTickets to delete.
     */
    limit?: number
  }

  /**
   * RaffleTicket without action
   */
  export type RaffleTicketDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RaffleTicket
     */
    select?: RaffleTicketSelect<ExtArgs> | null
    /**
     * Omit specific fields from the RaffleTicket
     */
    omit?: RaffleTicketOmit<ExtArgs> | null
  }


  /**
   * Model Referral
   */

  export type AggregateReferral = {
    _count: ReferralCountAggregateOutputType | null
    _avg: ReferralAvgAggregateOutputType | null
    _sum: ReferralSumAggregateOutputType | null
    _min: ReferralMinAggregateOutputType | null
    _max: ReferralMaxAggregateOutputType | null
  }

  export type ReferralAvgAggregateOutputType = {
    clicks: number | null
  }

  export type ReferralSumAggregateOutputType = {
    clicks: number | null
  }

  export type ReferralMinAggregateOutputType = {
    id: string | null
    code: string | null
    influencerName: string | null
    influencerEmail: string | null
    influencerPhone: string | null
    isActive: boolean | null
    clicks: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralMaxAggregateOutputType = {
    id: string | null
    code: string | null
    influencerName: string | null
    influencerEmail: string | null
    influencerPhone: string | null
    isActive: boolean | null
    clicks: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralCountAggregateOutputType = {
    id: number
    code: number
    influencerName: number
    influencerEmail: number
    influencerPhone: number
    isActive: number
    clicks: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReferralAvgAggregateInputType = {
    clicks?: true
  }

  export type ReferralSumAggregateInputType = {
    clicks?: true
  }

  export type ReferralMinAggregateInputType = {
    id?: true
    code?: true
    influencerName?: true
    influencerEmail?: true
    influencerPhone?: true
    isActive?: true
    clicks?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralMaxAggregateInputType = {
    id?: true
    code?: true
    influencerName?: true
    influencerEmail?: true
    influencerPhone?: true
    isActive?: true
    clicks?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralCountAggregateInputType = {
    id?: true
    code?: true
    influencerName?: true
    influencerEmail?: true
    influencerPhone?: true
    isActive?: true
    clicks?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReferralAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Referral to aggregate.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Referrals
    **/
    _count?: true | ReferralCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReferralAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReferralSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReferralMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReferralMaxAggregateInputType
  }

  export type GetReferralAggregateType<T extends ReferralAggregateArgs> = {
        [P in keyof T & keyof AggregateReferral]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReferral[P]>
      : GetScalarType<T[P], AggregateReferral[P]>
  }




  export type ReferralGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralWhereInput
    orderBy?: ReferralOrderByWithAggregationInput | ReferralOrderByWithAggregationInput[]
    by: ReferralScalarFieldEnum[] | ReferralScalarFieldEnum
    having?: ReferralScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReferralCountAggregateInputType | true
    _avg?: ReferralAvgAggregateInputType
    _sum?: ReferralSumAggregateInputType
    _min?: ReferralMinAggregateInputType
    _max?: ReferralMaxAggregateInputType
  }

  export type ReferralGroupByOutputType = {
    id: string
    code: string
    influencerName: string
    influencerEmail: string | null
    influencerPhone: string | null
    isActive: boolean
    clicks: number
    createdAt: Date
    updatedAt: Date
    _count: ReferralCountAggregateOutputType | null
    _avg: ReferralAvgAggregateOutputType | null
    _sum: ReferralSumAggregateOutputType | null
    _min: ReferralMinAggregateOutputType | null
    _max: ReferralMaxAggregateOutputType | null
  }

  type GetReferralGroupByPayload<T extends ReferralGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReferralGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReferralGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReferralGroupByOutputType[P]>
            : GetScalarType<T[P], ReferralGroupByOutputType[P]>
        }
      >
    >


  export type ReferralSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    influencerName?: boolean
    influencerEmail?: boolean
    influencerPhone?: boolean
    isActive?: boolean
    clicks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referral"]>

  export type ReferralSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    influencerName?: boolean
    influencerEmail?: boolean
    influencerPhone?: boolean
    isActive?: boolean
    clicks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referral"]>

  export type ReferralSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    code?: boolean
    influencerName?: boolean
    influencerEmail?: boolean
    influencerPhone?: boolean
    isActive?: boolean
    clicks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referral"]>

  export type ReferralSelectScalar = {
    id?: boolean
    code?: boolean
    influencerName?: boolean
    influencerEmail?: boolean
    influencerPhone?: boolean
    isActive?: boolean
    clicks?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReferralOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "code" | "influencerName" | "influencerEmail" | "influencerPhone" | "isActive" | "clicks" | "createdAt" | "updatedAt", ExtArgs["result"]["referral"]>

  export type $ReferralPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Referral"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      code: string
      influencerName: string
      influencerEmail: string | null
      influencerPhone: string | null
      isActive: boolean
      clicks: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["referral"]>
    composites: {}
  }

  type ReferralGetPayload<S extends boolean | null | undefined | ReferralDefaultArgs> = $Result.GetResult<Prisma.$ReferralPayload, S>

  type ReferralCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReferralFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReferralCountAggregateInputType | true
    }

  export interface ReferralDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Referral'], meta: { name: 'Referral' } }
    /**
     * Find zero or one Referral that matches the filter.
     * @param {ReferralFindUniqueArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReferralFindUniqueArgs>(args: SelectSubset<T, ReferralFindUniqueArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Referral that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReferralFindUniqueOrThrowArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReferralFindUniqueOrThrowArgs>(args: SelectSubset<T, ReferralFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Referral that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralFindFirstArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReferralFindFirstArgs>(args?: SelectSubset<T, ReferralFindFirstArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Referral that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralFindFirstOrThrowArgs} args - Arguments to find a Referral
     * @example
     * // Get one Referral
     * const referral = await prisma.referral.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReferralFindFirstOrThrowArgs>(args?: SelectSubset<T, ReferralFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Referrals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Referrals
     * const referrals = await prisma.referral.findMany()
     * 
     * // Get first 10 Referrals
     * const referrals = await prisma.referral.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const referralWithIdOnly = await prisma.referral.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReferralFindManyArgs>(args?: SelectSubset<T, ReferralFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Referral.
     * @param {ReferralCreateArgs} args - Arguments to create a Referral.
     * @example
     * // Create one Referral
     * const Referral = await prisma.referral.create({
     *   data: {
     *     // ... data to create a Referral
     *   }
     * })
     * 
     */
    create<T extends ReferralCreateArgs>(args: SelectSubset<T, ReferralCreateArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Referrals.
     * @param {ReferralCreateManyArgs} args - Arguments to create many Referrals.
     * @example
     * // Create many Referrals
     * const referral = await prisma.referral.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReferralCreateManyArgs>(args?: SelectSubset<T, ReferralCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Referrals and returns the data saved in the database.
     * @param {ReferralCreateManyAndReturnArgs} args - Arguments to create many Referrals.
     * @example
     * // Create many Referrals
     * const referral = await prisma.referral.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Referrals and only return the `id`
     * const referralWithIdOnly = await prisma.referral.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReferralCreateManyAndReturnArgs>(args?: SelectSubset<T, ReferralCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Referral.
     * @param {ReferralDeleteArgs} args - Arguments to delete one Referral.
     * @example
     * // Delete one Referral
     * const Referral = await prisma.referral.delete({
     *   where: {
     *     // ... filter to delete one Referral
     *   }
     * })
     * 
     */
    delete<T extends ReferralDeleteArgs>(args: SelectSubset<T, ReferralDeleteArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Referral.
     * @param {ReferralUpdateArgs} args - Arguments to update one Referral.
     * @example
     * // Update one Referral
     * const referral = await prisma.referral.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReferralUpdateArgs>(args: SelectSubset<T, ReferralUpdateArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Referrals.
     * @param {ReferralDeleteManyArgs} args - Arguments to filter Referrals to delete.
     * @example
     * // Delete a few Referrals
     * const { count } = await prisma.referral.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReferralDeleteManyArgs>(args?: SelectSubset<T, ReferralDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Referrals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Referrals
     * const referral = await prisma.referral.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReferralUpdateManyArgs>(args: SelectSubset<T, ReferralUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Referrals and returns the data updated in the database.
     * @param {ReferralUpdateManyAndReturnArgs} args - Arguments to update many Referrals.
     * @example
     * // Update many Referrals
     * const referral = await prisma.referral.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Referrals and only return the `id`
     * const referralWithIdOnly = await prisma.referral.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ReferralUpdateManyAndReturnArgs>(args: SelectSubset<T, ReferralUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Referral.
     * @param {ReferralUpsertArgs} args - Arguments to update or create a Referral.
     * @example
     * // Update or create a Referral
     * const referral = await prisma.referral.upsert({
     *   create: {
     *     // ... data to create a Referral
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Referral we want to update
     *   }
     * })
     */
    upsert<T extends ReferralUpsertArgs>(args: SelectSubset<T, ReferralUpsertArgs<ExtArgs>>): Prisma__ReferralClient<$Result.GetResult<Prisma.$ReferralPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Referrals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralCountArgs} args - Arguments to filter Referrals to count.
     * @example
     * // Count the number of Referrals
     * const count = await prisma.referral.count({
     *   where: {
     *     // ... the filter for the Referrals we want to count
     *   }
     * })
    **/
    count<T extends ReferralCountArgs>(
      args?: Subset<T, ReferralCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReferralCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Referral.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ReferralAggregateArgs>(args: Subset<T, ReferralAggregateArgs>): Prisma.PrismaPromise<GetReferralAggregateType<T>>

    /**
     * Group by Referral.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ReferralGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReferralGroupByArgs['orderBy'] }
        : { orderBy?: ReferralGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ReferralGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReferralGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Referral model
   */
  readonly fields: ReferralFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Referral.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReferralClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Referral model
   */
  interface ReferralFieldRefs {
    readonly id: FieldRef<"Referral", 'String'>
    readonly code: FieldRef<"Referral", 'String'>
    readonly influencerName: FieldRef<"Referral", 'String'>
    readonly influencerEmail: FieldRef<"Referral", 'String'>
    readonly influencerPhone: FieldRef<"Referral", 'String'>
    readonly isActive: FieldRef<"Referral", 'Boolean'>
    readonly clicks: FieldRef<"Referral", 'Int'>
    readonly createdAt: FieldRef<"Referral", 'DateTime'>
    readonly updatedAt: FieldRef<"Referral", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Referral findUnique
   */
  export type ReferralFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral findUniqueOrThrow
   */
  export type ReferralFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral findFirst
   */
  export type ReferralFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Referrals.
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Referrals.
     */
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * Referral findFirstOrThrow
   */
  export type ReferralFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * Filter, which Referral to fetch.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Referrals.
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Referrals.
     */
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * Referral findMany
   */
  export type ReferralFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * Filter, which Referrals to fetch.
     */
    where?: ReferralWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Referrals to fetch.
     */
    orderBy?: ReferralOrderByWithRelationInput | ReferralOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Referrals.
     */
    cursor?: ReferralWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Referrals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Referrals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Referrals.
     */
    distinct?: ReferralScalarFieldEnum | ReferralScalarFieldEnum[]
  }

  /**
   * Referral create
   */
  export type ReferralCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * The data needed to create a Referral.
     */
    data: XOR<ReferralCreateInput, ReferralUncheckedCreateInput>
  }

  /**
   * Referral createMany
   */
  export type ReferralCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Referrals.
     */
    data: ReferralCreateManyInput | ReferralCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Referral createManyAndReturn
   */
  export type ReferralCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * The data used to create many Referrals.
     */
    data: ReferralCreateManyInput | ReferralCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Referral update
   */
  export type ReferralUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * The data needed to update a Referral.
     */
    data: XOR<ReferralUpdateInput, ReferralUncheckedUpdateInput>
    /**
     * Choose, which Referral to update.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral updateMany
   */
  export type ReferralUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Referrals.
     */
    data: XOR<ReferralUpdateManyMutationInput, ReferralUncheckedUpdateManyInput>
    /**
     * Filter which Referrals to update
     */
    where?: ReferralWhereInput
    /**
     * Limit how many Referrals to update.
     */
    limit?: number
  }

  /**
   * Referral updateManyAndReturn
   */
  export type ReferralUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * The data used to update Referrals.
     */
    data: XOR<ReferralUpdateManyMutationInput, ReferralUncheckedUpdateManyInput>
    /**
     * Filter which Referrals to update
     */
    where?: ReferralWhereInput
    /**
     * Limit how many Referrals to update.
     */
    limit?: number
  }

  /**
   * Referral upsert
   */
  export type ReferralUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * The filter to search for the Referral to update in case it exists.
     */
    where: ReferralWhereUniqueInput
    /**
     * In case the Referral found by the `where` argument doesn't exist, create a new Referral with this data.
     */
    create: XOR<ReferralCreateInput, ReferralUncheckedCreateInput>
    /**
     * In case the Referral was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReferralUpdateInput, ReferralUncheckedUpdateInput>
  }

  /**
   * Referral delete
   */
  export type ReferralDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
    /**
     * Filter which Referral to delete.
     */
    where: ReferralWhereUniqueInput
  }

  /**
   * Referral deleteMany
   */
  export type ReferralDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Referrals to delete
     */
    where?: ReferralWhereInput
    /**
     * Limit how many Referrals to delete.
     */
    limit?: number
  }

  /**
   * Referral without action
   */
  export type ReferralDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Referral
     */
    select?: ReferralSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Referral
     */
    omit?: ReferralOmit<ExtArgs> | null
  }


  /**
   * Model Donation
   */

  export type AggregateDonation = {
    _count: DonationCountAggregateOutputType | null
    _avg: DonationAvgAggregateOutputType | null
    _sum: DonationSumAggregateOutputType | null
    _min: DonationMinAggregateOutputType | null
    _max: DonationMaxAggregateOutputType | null
  }

  export type DonationAvgAggregateOutputType = {
    amount: number | null
  }

  export type DonationSumAggregateOutputType = {
    amount: number | null
  }

  export type DonationMinAggregateOutputType = {
    id: string | null
    amount: number | null
    name: string | null
    email: string | null
    phone: string | null
    status: string | null
    checkoutRequestId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    failureReason: string | null
    mpesaCode: string | null
  }

  export type DonationMaxAggregateOutputType = {
    id: string | null
    amount: number | null
    name: string | null
    email: string | null
    phone: string | null
    status: string | null
    checkoutRequestId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    failureReason: string | null
    mpesaCode: string | null
  }

  export type DonationCountAggregateOutputType = {
    id: number
    amount: number
    name: number
    email: number
    phone: number
    status: number
    checkoutRequestId: number
    createdAt: number
    updatedAt: number
    failureReason: number
    mpesaCode: number
    paymentDetails: number
    _all: number
  }


  export type DonationAvgAggregateInputType = {
    amount?: true
  }

  export type DonationSumAggregateInputType = {
    amount?: true
  }

  export type DonationMinAggregateInputType = {
    id?: true
    amount?: true
    name?: true
    email?: true
    phone?: true
    status?: true
    checkoutRequestId?: true
    createdAt?: true
    updatedAt?: true
    failureReason?: true
    mpesaCode?: true
  }

  export type DonationMaxAggregateInputType = {
    id?: true
    amount?: true
    name?: true
    email?: true
    phone?: true
    status?: true
    checkoutRequestId?: true
    createdAt?: true
    updatedAt?: true
    failureReason?: true
    mpesaCode?: true
  }

  export type DonationCountAggregateInputType = {
    id?: true
    amount?: true
    name?: true
    email?: true
    phone?: true
    status?: true
    checkoutRequestId?: true
    createdAt?: true
    updatedAt?: true
    failureReason?: true
    mpesaCode?: true
    paymentDetails?: true
    _all?: true
  }

  export type DonationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Donation to aggregate.
     */
    where?: DonationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Donations to fetch.
     */
    orderBy?: DonationOrderByWithRelationInput | DonationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DonationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Donations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Donations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Donations
    **/
    _count?: true | DonationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DonationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DonationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DonationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DonationMaxAggregateInputType
  }

  export type GetDonationAggregateType<T extends DonationAggregateArgs> = {
        [P in keyof T & keyof AggregateDonation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDonation[P]>
      : GetScalarType<T[P], AggregateDonation[P]>
  }




  export type DonationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DonationWhereInput
    orderBy?: DonationOrderByWithAggregationInput | DonationOrderByWithAggregationInput[]
    by: DonationScalarFieldEnum[] | DonationScalarFieldEnum
    having?: DonationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DonationCountAggregateInputType | true
    _avg?: DonationAvgAggregateInputType
    _sum?: DonationSumAggregateInputType
    _min?: DonationMinAggregateInputType
    _max?: DonationMaxAggregateInputType
  }

  export type DonationGroupByOutputType = {
    id: string
    amount: number
    name: string | null
    email: string | null
    phone: string | null
    status: string
    checkoutRequestId: string | null
    createdAt: Date
    updatedAt: Date
    failureReason: string | null
    mpesaCode: string | null
    paymentDetails: JsonValue | null
    _count: DonationCountAggregateOutputType | null
    _avg: DonationAvgAggregateOutputType | null
    _sum: DonationSumAggregateOutputType | null
    _min: DonationMinAggregateOutputType | null
    _max: DonationMaxAggregateOutputType | null
  }

  type GetDonationGroupByPayload<T extends DonationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DonationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DonationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DonationGroupByOutputType[P]>
            : GetScalarType<T[P], DonationGroupByOutputType[P]>
        }
      >
    >


  export type DonationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amount?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    status?: boolean
    checkoutRequestId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
  }, ExtArgs["result"]["donation"]>

  export type DonationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amount?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    status?: boolean
    checkoutRequestId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
  }, ExtArgs["result"]["donation"]>

  export type DonationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    amount?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    status?: boolean
    checkoutRequestId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
  }, ExtArgs["result"]["donation"]>

  export type DonationSelectScalar = {
    id?: boolean
    amount?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    status?: boolean
    checkoutRequestId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    failureReason?: boolean
    mpesaCode?: boolean
    paymentDetails?: boolean
  }

  export type DonationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "amount" | "name" | "email" | "phone" | "status" | "checkoutRequestId" | "createdAt" | "updatedAt" | "failureReason" | "mpesaCode" | "paymentDetails", ExtArgs["result"]["donation"]>

  export type $DonationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Donation"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      amount: number
      name: string | null
      email: string | null
      phone: string | null
      status: string
      checkoutRequestId: string | null
      createdAt: Date
      updatedAt: Date
      failureReason: string | null
      mpesaCode: string | null
      paymentDetails: Prisma.JsonValue | null
    }, ExtArgs["result"]["donation"]>
    composites: {}
  }

  type DonationGetPayload<S extends boolean | null | undefined | DonationDefaultArgs> = $Result.GetResult<Prisma.$DonationPayload, S>

  type DonationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DonationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DonationCountAggregateInputType | true
    }

  export interface DonationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Donation'], meta: { name: 'Donation' } }
    /**
     * Find zero or one Donation that matches the filter.
     * @param {DonationFindUniqueArgs} args - Arguments to find a Donation
     * @example
     * // Get one Donation
     * const donation = await prisma.donation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DonationFindUniqueArgs>(args: SelectSubset<T, DonationFindUniqueArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Donation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DonationFindUniqueOrThrowArgs} args - Arguments to find a Donation
     * @example
     * // Get one Donation
     * const donation = await prisma.donation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DonationFindUniqueOrThrowArgs>(args: SelectSubset<T, DonationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Donation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationFindFirstArgs} args - Arguments to find a Donation
     * @example
     * // Get one Donation
     * const donation = await prisma.donation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DonationFindFirstArgs>(args?: SelectSubset<T, DonationFindFirstArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Donation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationFindFirstOrThrowArgs} args - Arguments to find a Donation
     * @example
     * // Get one Donation
     * const donation = await prisma.donation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DonationFindFirstOrThrowArgs>(args?: SelectSubset<T, DonationFindFirstOrThrowArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Donations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Donations
     * const donations = await prisma.donation.findMany()
     * 
     * // Get first 10 Donations
     * const donations = await prisma.donation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const donationWithIdOnly = await prisma.donation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DonationFindManyArgs>(args?: SelectSubset<T, DonationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Donation.
     * @param {DonationCreateArgs} args - Arguments to create a Donation.
     * @example
     * // Create one Donation
     * const Donation = await prisma.donation.create({
     *   data: {
     *     // ... data to create a Donation
     *   }
     * })
     * 
     */
    create<T extends DonationCreateArgs>(args: SelectSubset<T, DonationCreateArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Donations.
     * @param {DonationCreateManyArgs} args - Arguments to create many Donations.
     * @example
     * // Create many Donations
     * const donation = await prisma.donation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DonationCreateManyArgs>(args?: SelectSubset<T, DonationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Donations and returns the data saved in the database.
     * @param {DonationCreateManyAndReturnArgs} args - Arguments to create many Donations.
     * @example
     * // Create many Donations
     * const donation = await prisma.donation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Donations and only return the `id`
     * const donationWithIdOnly = await prisma.donation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DonationCreateManyAndReturnArgs>(args?: SelectSubset<T, DonationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Donation.
     * @param {DonationDeleteArgs} args - Arguments to delete one Donation.
     * @example
     * // Delete one Donation
     * const Donation = await prisma.donation.delete({
     *   where: {
     *     // ... filter to delete one Donation
     *   }
     * })
     * 
     */
    delete<T extends DonationDeleteArgs>(args: SelectSubset<T, DonationDeleteArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Donation.
     * @param {DonationUpdateArgs} args - Arguments to update one Donation.
     * @example
     * // Update one Donation
     * const donation = await prisma.donation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DonationUpdateArgs>(args: SelectSubset<T, DonationUpdateArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Donations.
     * @param {DonationDeleteManyArgs} args - Arguments to filter Donations to delete.
     * @example
     * // Delete a few Donations
     * const { count } = await prisma.donation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DonationDeleteManyArgs>(args?: SelectSubset<T, DonationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Donations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Donations
     * const donation = await prisma.donation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DonationUpdateManyArgs>(args: SelectSubset<T, DonationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Donations and returns the data updated in the database.
     * @param {DonationUpdateManyAndReturnArgs} args - Arguments to update many Donations.
     * @example
     * // Update many Donations
     * const donation = await prisma.donation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Donations and only return the `id`
     * const donationWithIdOnly = await prisma.donation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DonationUpdateManyAndReturnArgs>(args: SelectSubset<T, DonationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Donation.
     * @param {DonationUpsertArgs} args - Arguments to update or create a Donation.
     * @example
     * // Update or create a Donation
     * const donation = await prisma.donation.upsert({
     *   create: {
     *     // ... data to create a Donation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Donation we want to update
     *   }
     * })
     */
    upsert<T extends DonationUpsertArgs>(args: SelectSubset<T, DonationUpsertArgs<ExtArgs>>): Prisma__DonationClient<$Result.GetResult<Prisma.$DonationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Donations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationCountArgs} args - Arguments to filter Donations to count.
     * @example
     * // Count the number of Donations
     * const count = await prisma.donation.count({
     *   where: {
     *     // ... the filter for the Donations we want to count
     *   }
     * })
    **/
    count<T extends DonationCountArgs>(
      args?: Subset<T, DonationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DonationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Donation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DonationAggregateArgs>(args: Subset<T, DonationAggregateArgs>): Prisma.PrismaPromise<GetDonationAggregateType<T>>

    /**
     * Group by Donation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DonationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DonationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DonationGroupByArgs['orderBy'] }
        : { orderBy?: DonationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DonationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDonationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Donation model
   */
  readonly fields: DonationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Donation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DonationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Donation model
   */
  interface DonationFieldRefs {
    readonly id: FieldRef<"Donation", 'String'>
    readonly amount: FieldRef<"Donation", 'Float'>
    readonly name: FieldRef<"Donation", 'String'>
    readonly email: FieldRef<"Donation", 'String'>
    readonly phone: FieldRef<"Donation", 'String'>
    readonly status: FieldRef<"Donation", 'String'>
    readonly checkoutRequestId: FieldRef<"Donation", 'String'>
    readonly createdAt: FieldRef<"Donation", 'DateTime'>
    readonly updatedAt: FieldRef<"Donation", 'DateTime'>
    readonly failureReason: FieldRef<"Donation", 'String'>
    readonly mpesaCode: FieldRef<"Donation", 'String'>
    readonly paymentDetails: FieldRef<"Donation", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Donation findUnique
   */
  export type DonationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * Filter, which Donation to fetch.
     */
    where: DonationWhereUniqueInput
  }

  /**
   * Donation findUniqueOrThrow
   */
  export type DonationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * Filter, which Donation to fetch.
     */
    where: DonationWhereUniqueInput
  }

  /**
   * Donation findFirst
   */
  export type DonationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * Filter, which Donation to fetch.
     */
    where?: DonationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Donations to fetch.
     */
    orderBy?: DonationOrderByWithRelationInput | DonationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Donations.
     */
    cursor?: DonationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Donations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Donations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Donations.
     */
    distinct?: DonationScalarFieldEnum | DonationScalarFieldEnum[]
  }

  /**
   * Donation findFirstOrThrow
   */
  export type DonationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * Filter, which Donation to fetch.
     */
    where?: DonationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Donations to fetch.
     */
    orderBy?: DonationOrderByWithRelationInput | DonationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Donations.
     */
    cursor?: DonationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Donations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Donations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Donations.
     */
    distinct?: DonationScalarFieldEnum | DonationScalarFieldEnum[]
  }

  /**
   * Donation findMany
   */
  export type DonationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * Filter, which Donations to fetch.
     */
    where?: DonationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Donations to fetch.
     */
    orderBy?: DonationOrderByWithRelationInput | DonationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Donations.
     */
    cursor?: DonationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Donations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Donations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Donations.
     */
    distinct?: DonationScalarFieldEnum | DonationScalarFieldEnum[]
  }

  /**
   * Donation create
   */
  export type DonationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * The data needed to create a Donation.
     */
    data: XOR<DonationCreateInput, DonationUncheckedCreateInput>
  }

  /**
   * Donation createMany
   */
  export type DonationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Donations.
     */
    data: DonationCreateManyInput | DonationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Donation createManyAndReturn
   */
  export type DonationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * The data used to create many Donations.
     */
    data: DonationCreateManyInput | DonationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Donation update
   */
  export type DonationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * The data needed to update a Donation.
     */
    data: XOR<DonationUpdateInput, DonationUncheckedUpdateInput>
    /**
     * Choose, which Donation to update.
     */
    where: DonationWhereUniqueInput
  }

  /**
   * Donation updateMany
   */
  export type DonationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Donations.
     */
    data: XOR<DonationUpdateManyMutationInput, DonationUncheckedUpdateManyInput>
    /**
     * Filter which Donations to update
     */
    where?: DonationWhereInput
    /**
     * Limit how many Donations to update.
     */
    limit?: number
  }

  /**
   * Donation updateManyAndReturn
   */
  export type DonationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * The data used to update Donations.
     */
    data: XOR<DonationUpdateManyMutationInput, DonationUncheckedUpdateManyInput>
    /**
     * Filter which Donations to update
     */
    where?: DonationWhereInput
    /**
     * Limit how many Donations to update.
     */
    limit?: number
  }

  /**
   * Donation upsert
   */
  export type DonationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * The filter to search for the Donation to update in case it exists.
     */
    where: DonationWhereUniqueInput
    /**
     * In case the Donation found by the `where` argument doesn't exist, create a new Donation with this data.
     */
    create: XOR<DonationCreateInput, DonationUncheckedCreateInput>
    /**
     * In case the Donation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DonationUpdateInput, DonationUncheckedUpdateInput>
  }

  /**
   * Donation delete
   */
  export type DonationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
    /**
     * Filter which Donation to delete.
     */
    where: DonationWhereUniqueInput
  }

  /**
   * Donation deleteMany
   */
  export type DonationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Donations to delete
     */
    where?: DonationWhereInput
    /**
     * Limit how many Donations to delete.
     */
    limit?: number
  }

  /**
   * Donation without action
   */
  export type DonationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Donation
     */
    select?: DonationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Donation
     */
    omit?: DonationOmit<ExtArgs> | null
  }


  /**
   * Model SmsLog
   */

  export type AggregateSmsLog = {
    _count: SmsLogCountAggregateOutputType | null
    _min: SmsLogMinAggregateOutputType | null
    _max: SmsLogMaxAggregateOutputType | null
  }

  export type SmsLogMinAggregateOutputType = {
    id: string | null
    phoneNumber: string | null
    message: string | null
    status: string | null
    messageId: string | null
    cost: string | null
    sentAt: Date | null
  }

  export type SmsLogMaxAggregateOutputType = {
    id: string | null
    phoneNumber: string | null
    message: string | null
    status: string | null
    messageId: string | null
    cost: string | null
    sentAt: Date | null
  }

  export type SmsLogCountAggregateOutputType = {
    id: number
    phoneNumber: number
    message: number
    status: number
    messageId: number
    cost: number
    sentAt: number
    _all: number
  }


  export type SmsLogMinAggregateInputType = {
    id?: true
    phoneNumber?: true
    message?: true
    status?: true
    messageId?: true
    cost?: true
    sentAt?: true
  }

  export type SmsLogMaxAggregateInputType = {
    id?: true
    phoneNumber?: true
    message?: true
    status?: true
    messageId?: true
    cost?: true
    sentAt?: true
  }

  export type SmsLogCountAggregateInputType = {
    id?: true
    phoneNumber?: true
    message?: true
    status?: true
    messageId?: true
    cost?: true
    sentAt?: true
    _all?: true
  }

  export type SmsLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SmsLog to aggregate.
     */
    where?: SmsLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SmsLogs to fetch.
     */
    orderBy?: SmsLogOrderByWithRelationInput | SmsLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SmsLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SmsLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SmsLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned SmsLogs
    **/
    _count?: true | SmsLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SmsLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SmsLogMaxAggregateInputType
  }

  export type GetSmsLogAggregateType<T extends SmsLogAggregateArgs> = {
        [P in keyof T & keyof AggregateSmsLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSmsLog[P]>
      : GetScalarType<T[P], AggregateSmsLog[P]>
  }




  export type SmsLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SmsLogWhereInput
    orderBy?: SmsLogOrderByWithAggregationInput | SmsLogOrderByWithAggregationInput[]
    by: SmsLogScalarFieldEnum[] | SmsLogScalarFieldEnum
    having?: SmsLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SmsLogCountAggregateInputType | true
    _min?: SmsLogMinAggregateInputType
    _max?: SmsLogMaxAggregateInputType
  }

  export type SmsLogGroupByOutputType = {
    id: string
    phoneNumber: string
    message: string
    status: string
    messageId: string | null
    cost: string | null
    sentAt: Date
    _count: SmsLogCountAggregateOutputType | null
    _min: SmsLogMinAggregateOutputType | null
    _max: SmsLogMaxAggregateOutputType | null
  }

  type GetSmsLogGroupByPayload<T extends SmsLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SmsLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SmsLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SmsLogGroupByOutputType[P]>
            : GetScalarType<T[P], SmsLogGroupByOutputType[P]>
        }
      >
    >


  export type SmsLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    phoneNumber?: boolean
    message?: boolean
    status?: boolean
    messageId?: boolean
    cost?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["smsLog"]>

  export type SmsLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    phoneNumber?: boolean
    message?: boolean
    status?: boolean
    messageId?: boolean
    cost?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["smsLog"]>

  export type SmsLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    phoneNumber?: boolean
    message?: boolean
    status?: boolean
    messageId?: boolean
    cost?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["smsLog"]>

  export type SmsLogSelectScalar = {
    id?: boolean
    phoneNumber?: boolean
    message?: boolean
    status?: boolean
    messageId?: boolean
    cost?: boolean
    sentAt?: boolean
  }

  export type SmsLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "phoneNumber" | "message" | "status" | "messageId" | "cost" | "sentAt", ExtArgs["result"]["smsLog"]>

  export type $SmsLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "SmsLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      phoneNumber: string
      message: string
      status: string
      messageId: string | null
      cost: string | null
      sentAt: Date
    }, ExtArgs["result"]["smsLog"]>
    composites: {}
  }

  type SmsLogGetPayload<S extends boolean | null | undefined | SmsLogDefaultArgs> = $Result.GetResult<Prisma.$SmsLogPayload, S>

  type SmsLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SmsLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SmsLogCountAggregateInputType | true
    }

  export interface SmsLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['SmsLog'], meta: { name: 'SmsLog' } }
    /**
     * Find zero or one SmsLog that matches the filter.
     * @param {SmsLogFindUniqueArgs} args - Arguments to find a SmsLog
     * @example
     * // Get one SmsLog
     * const smsLog = await prisma.smsLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SmsLogFindUniqueArgs>(args: SelectSubset<T, SmsLogFindUniqueArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one SmsLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SmsLogFindUniqueOrThrowArgs} args - Arguments to find a SmsLog
     * @example
     * // Get one SmsLog
     * const smsLog = await prisma.smsLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SmsLogFindUniqueOrThrowArgs>(args: SelectSubset<T, SmsLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SmsLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogFindFirstArgs} args - Arguments to find a SmsLog
     * @example
     * // Get one SmsLog
     * const smsLog = await prisma.smsLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SmsLogFindFirstArgs>(args?: SelectSubset<T, SmsLogFindFirstArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first SmsLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogFindFirstOrThrowArgs} args - Arguments to find a SmsLog
     * @example
     * // Get one SmsLog
     * const smsLog = await prisma.smsLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SmsLogFindFirstOrThrowArgs>(args?: SelectSubset<T, SmsLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more SmsLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all SmsLogs
     * const smsLogs = await prisma.smsLog.findMany()
     * 
     * // Get first 10 SmsLogs
     * const smsLogs = await prisma.smsLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const smsLogWithIdOnly = await prisma.smsLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SmsLogFindManyArgs>(args?: SelectSubset<T, SmsLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a SmsLog.
     * @param {SmsLogCreateArgs} args - Arguments to create a SmsLog.
     * @example
     * // Create one SmsLog
     * const SmsLog = await prisma.smsLog.create({
     *   data: {
     *     // ... data to create a SmsLog
     *   }
     * })
     * 
     */
    create<T extends SmsLogCreateArgs>(args: SelectSubset<T, SmsLogCreateArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many SmsLogs.
     * @param {SmsLogCreateManyArgs} args - Arguments to create many SmsLogs.
     * @example
     * // Create many SmsLogs
     * const smsLog = await prisma.smsLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SmsLogCreateManyArgs>(args?: SelectSubset<T, SmsLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many SmsLogs and returns the data saved in the database.
     * @param {SmsLogCreateManyAndReturnArgs} args - Arguments to create many SmsLogs.
     * @example
     * // Create many SmsLogs
     * const smsLog = await prisma.smsLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many SmsLogs and only return the `id`
     * const smsLogWithIdOnly = await prisma.smsLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SmsLogCreateManyAndReturnArgs>(args?: SelectSubset<T, SmsLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a SmsLog.
     * @param {SmsLogDeleteArgs} args - Arguments to delete one SmsLog.
     * @example
     * // Delete one SmsLog
     * const SmsLog = await prisma.smsLog.delete({
     *   where: {
     *     // ... filter to delete one SmsLog
     *   }
     * })
     * 
     */
    delete<T extends SmsLogDeleteArgs>(args: SelectSubset<T, SmsLogDeleteArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one SmsLog.
     * @param {SmsLogUpdateArgs} args - Arguments to update one SmsLog.
     * @example
     * // Update one SmsLog
     * const smsLog = await prisma.smsLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SmsLogUpdateArgs>(args: SelectSubset<T, SmsLogUpdateArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more SmsLogs.
     * @param {SmsLogDeleteManyArgs} args - Arguments to filter SmsLogs to delete.
     * @example
     * // Delete a few SmsLogs
     * const { count } = await prisma.smsLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SmsLogDeleteManyArgs>(args?: SelectSubset<T, SmsLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SmsLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many SmsLogs
     * const smsLog = await prisma.smsLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SmsLogUpdateManyArgs>(args: SelectSubset<T, SmsLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more SmsLogs and returns the data updated in the database.
     * @param {SmsLogUpdateManyAndReturnArgs} args - Arguments to update many SmsLogs.
     * @example
     * // Update many SmsLogs
     * const smsLog = await prisma.smsLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more SmsLogs and only return the `id`
     * const smsLogWithIdOnly = await prisma.smsLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SmsLogUpdateManyAndReturnArgs>(args: SelectSubset<T, SmsLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one SmsLog.
     * @param {SmsLogUpsertArgs} args - Arguments to update or create a SmsLog.
     * @example
     * // Update or create a SmsLog
     * const smsLog = await prisma.smsLog.upsert({
     *   create: {
     *     // ... data to create a SmsLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the SmsLog we want to update
     *   }
     * })
     */
    upsert<T extends SmsLogUpsertArgs>(args: SelectSubset<T, SmsLogUpsertArgs<ExtArgs>>): Prisma__SmsLogClient<$Result.GetResult<Prisma.$SmsLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of SmsLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogCountArgs} args - Arguments to filter SmsLogs to count.
     * @example
     * // Count the number of SmsLogs
     * const count = await prisma.smsLog.count({
     *   where: {
     *     // ... the filter for the SmsLogs we want to count
     *   }
     * })
    **/
    count<T extends SmsLogCountArgs>(
      args?: Subset<T, SmsLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SmsLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a SmsLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SmsLogAggregateArgs>(args: Subset<T, SmsLogAggregateArgs>): Prisma.PrismaPromise<GetSmsLogAggregateType<T>>

    /**
     * Group by SmsLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SmsLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SmsLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SmsLogGroupByArgs['orderBy'] }
        : { orderBy?: SmsLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SmsLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSmsLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the SmsLog model
   */
  readonly fields: SmsLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for SmsLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SmsLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the SmsLog model
   */
  interface SmsLogFieldRefs {
    readonly id: FieldRef<"SmsLog", 'String'>
    readonly phoneNumber: FieldRef<"SmsLog", 'String'>
    readonly message: FieldRef<"SmsLog", 'String'>
    readonly status: FieldRef<"SmsLog", 'String'>
    readonly messageId: FieldRef<"SmsLog", 'String'>
    readonly cost: FieldRef<"SmsLog", 'String'>
    readonly sentAt: FieldRef<"SmsLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * SmsLog findUnique
   */
  export type SmsLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * Filter, which SmsLog to fetch.
     */
    where: SmsLogWhereUniqueInput
  }

  /**
   * SmsLog findUniqueOrThrow
   */
  export type SmsLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * Filter, which SmsLog to fetch.
     */
    where: SmsLogWhereUniqueInput
  }

  /**
   * SmsLog findFirst
   */
  export type SmsLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * Filter, which SmsLog to fetch.
     */
    where?: SmsLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SmsLogs to fetch.
     */
    orderBy?: SmsLogOrderByWithRelationInput | SmsLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SmsLogs.
     */
    cursor?: SmsLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SmsLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SmsLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SmsLogs.
     */
    distinct?: SmsLogScalarFieldEnum | SmsLogScalarFieldEnum[]
  }

  /**
   * SmsLog findFirstOrThrow
   */
  export type SmsLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * Filter, which SmsLog to fetch.
     */
    where?: SmsLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SmsLogs to fetch.
     */
    orderBy?: SmsLogOrderByWithRelationInput | SmsLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for SmsLogs.
     */
    cursor?: SmsLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SmsLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SmsLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SmsLogs.
     */
    distinct?: SmsLogScalarFieldEnum | SmsLogScalarFieldEnum[]
  }

  /**
   * SmsLog findMany
   */
  export type SmsLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * Filter, which SmsLogs to fetch.
     */
    where?: SmsLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of SmsLogs to fetch.
     */
    orderBy?: SmsLogOrderByWithRelationInput | SmsLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing SmsLogs.
     */
    cursor?: SmsLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` SmsLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` SmsLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of SmsLogs.
     */
    distinct?: SmsLogScalarFieldEnum | SmsLogScalarFieldEnum[]
  }

  /**
   * SmsLog create
   */
  export type SmsLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * The data needed to create a SmsLog.
     */
    data: XOR<SmsLogCreateInput, SmsLogUncheckedCreateInput>
  }

  /**
   * SmsLog createMany
   */
  export type SmsLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many SmsLogs.
     */
    data: SmsLogCreateManyInput | SmsLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SmsLog createManyAndReturn
   */
  export type SmsLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * The data used to create many SmsLogs.
     */
    data: SmsLogCreateManyInput | SmsLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * SmsLog update
   */
  export type SmsLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * The data needed to update a SmsLog.
     */
    data: XOR<SmsLogUpdateInput, SmsLogUncheckedUpdateInput>
    /**
     * Choose, which SmsLog to update.
     */
    where: SmsLogWhereUniqueInput
  }

  /**
   * SmsLog updateMany
   */
  export type SmsLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update SmsLogs.
     */
    data: XOR<SmsLogUpdateManyMutationInput, SmsLogUncheckedUpdateManyInput>
    /**
     * Filter which SmsLogs to update
     */
    where?: SmsLogWhereInput
    /**
     * Limit how many SmsLogs to update.
     */
    limit?: number
  }

  /**
   * SmsLog updateManyAndReturn
   */
  export type SmsLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * The data used to update SmsLogs.
     */
    data: XOR<SmsLogUpdateManyMutationInput, SmsLogUncheckedUpdateManyInput>
    /**
     * Filter which SmsLogs to update
     */
    where?: SmsLogWhereInput
    /**
     * Limit how many SmsLogs to update.
     */
    limit?: number
  }

  /**
   * SmsLog upsert
   */
  export type SmsLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * The filter to search for the SmsLog to update in case it exists.
     */
    where: SmsLogWhereUniqueInput
    /**
     * In case the SmsLog found by the `where` argument doesn't exist, create a new SmsLog with this data.
     */
    create: XOR<SmsLogCreateInput, SmsLogUncheckedCreateInput>
    /**
     * In case the SmsLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SmsLogUpdateInput, SmsLogUncheckedUpdateInput>
  }

  /**
   * SmsLog delete
   */
  export type SmsLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
    /**
     * Filter which SmsLog to delete.
     */
    where: SmsLogWhereUniqueInput
  }

  /**
   * SmsLog deleteMany
   */
  export type SmsLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which SmsLogs to delete
     */
    where?: SmsLogWhereInput
    /**
     * Limit how many SmsLogs to delete.
     */
    limit?: number
  }

  /**
   * SmsLog without action
   */
  export type SmsLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SmsLog
     */
    select?: SmsLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the SmsLog
     */
    omit?: SmsLogOmit<ExtArgs> | null
  }


  /**
   * Model ShortLink
   */

  export type AggregateShortLink = {
    _count: ShortLinkCountAggregateOutputType | null
    _avg: ShortLinkAvgAggregateOutputType | null
    _sum: ShortLinkSumAggregateOutputType | null
    _min: ShortLinkMinAggregateOutputType | null
    _max: ShortLinkMaxAggregateOutputType | null
  }

  export type ShortLinkAvgAggregateOutputType = {
    clicks: number | null
  }

  export type ShortLinkSumAggregateOutputType = {
    clicks: number | null
  }

  export type ShortLinkMinAggregateOutputType = {
    id: string | null
    url: string | null
    createdAt: Date | null
    clicks: number | null
  }

  export type ShortLinkMaxAggregateOutputType = {
    id: string | null
    url: string | null
    createdAt: Date | null
    clicks: number | null
  }

  export type ShortLinkCountAggregateOutputType = {
    id: number
    url: number
    createdAt: number
    clicks: number
    _all: number
  }


  export type ShortLinkAvgAggregateInputType = {
    clicks?: true
  }

  export type ShortLinkSumAggregateInputType = {
    clicks?: true
  }

  export type ShortLinkMinAggregateInputType = {
    id?: true
    url?: true
    createdAt?: true
    clicks?: true
  }

  export type ShortLinkMaxAggregateInputType = {
    id?: true
    url?: true
    createdAt?: true
    clicks?: true
  }

  export type ShortLinkCountAggregateInputType = {
    id?: true
    url?: true
    createdAt?: true
    clicks?: true
    _all?: true
  }

  export type ShortLinkAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ShortLink to aggregate.
     */
    where?: ShortLinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortLinks to fetch.
     */
    orderBy?: ShortLinkOrderByWithRelationInput | ShortLinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ShortLinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortLinks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortLinks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ShortLinks
    **/
    _count?: true | ShortLinkCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ShortLinkAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ShortLinkSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ShortLinkMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ShortLinkMaxAggregateInputType
  }

  export type GetShortLinkAggregateType<T extends ShortLinkAggregateArgs> = {
        [P in keyof T & keyof AggregateShortLink]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateShortLink[P]>
      : GetScalarType<T[P], AggregateShortLink[P]>
  }




  export type ShortLinkGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ShortLinkWhereInput
    orderBy?: ShortLinkOrderByWithAggregationInput | ShortLinkOrderByWithAggregationInput[]
    by: ShortLinkScalarFieldEnum[] | ShortLinkScalarFieldEnum
    having?: ShortLinkScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ShortLinkCountAggregateInputType | true
    _avg?: ShortLinkAvgAggregateInputType
    _sum?: ShortLinkSumAggregateInputType
    _min?: ShortLinkMinAggregateInputType
    _max?: ShortLinkMaxAggregateInputType
  }

  export type ShortLinkGroupByOutputType = {
    id: string
    url: string
    createdAt: Date
    clicks: number
    _count: ShortLinkCountAggregateOutputType | null
    _avg: ShortLinkAvgAggregateOutputType | null
    _sum: ShortLinkSumAggregateOutputType | null
    _min: ShortLinkMinAggregateOutputType | null
    _max: ShortLinkMaxAggregateOutputType | null
  }

  type GetShortLinkGroupByPayload<T extends ShortLinkGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ShortLinkGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ShortLinkGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ShortLinkGroupByOutputType[P]>
            : GetScalarType<T[P], ShortLinkGroupByOutputType[P]>
        }
      >
    >


  export type ShortLinkSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    createdAt?: boolean
    clicks?: boolean
  }, ExtArgs["result"]["shortLink"]>

  export type ShortLinkSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    createdAt?: boolean
    clicks?: boolean
  }, ExtArgs["result"]["shortLink"]>

  export type ShortLinkSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    url?: boolean
    createdAt?: boolean
    clicks?: boolean
  }, ExtArgs["result"]["shortLink"]>

  export type ShortLinkSelectScalar = {
    id?: boolean
    url?: boolean
    createdAt?: boolean
    clicks?: boolean
  }

  export type ShortLinkOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "url" | "createdAt" | "clicks", ExtArgs["result"]["shortLink"]>

  export type $ShortLinkPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ShortLink"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      url: string
      createdAt: Date
      clicks: number
    }, ExtArgs["result"]["shortLink"]>
    composites: {}
  }

  type ShortLinkGetPayload<S extends boolean | null | undefined | ShortLinkDefaultArgs> = $Result.GetResult<Prisma.$ShortLinkPayload, S>

  type ShortLinkCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ShortLinkFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ShortLinkCountAggregateInputType | true
    }

  export interface ShortLinkDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ShortLink'], meta: { name: 'ShortLink' } }
    /**
     * Find zero or one ShortLink that matches the filter.
     * @param {ShortLinkFindUniqueArgs} args - Arguments to find a ShortLink
     * @example
     * // Get one ShortLink
     * const shortLink = await prisma.shortLink.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ShortLinkFindUniqueArgs>(args: SelectSubset<T, ShortLinkFindUniqueArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ShortLink that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ShortLinkFindUniqueOrThrowArgs} args - Arguments to find a ShortLink
     * @example
     * // Get one ShortLink
     * const shortLink = await prisma.shortLink.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ShortLinkFindUniqueOrThrowArgs>(args: SelectSubset<T, ShortLinkFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ShortLink that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkFindFirstArgs} args - Arguments to find a ShortLink
     * @example
     * // Get one ShortLink
     * const shortLink = await prisma.shortLink.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ShortLinkFindFirstArgs>(args?: SelectSubset<T, ShortLinkFindFirstArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ShortLink that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkFindFirstOrThrowArgs} args - Arguments to find a ShortLink
     * @example
     * // Get one ShortLink
     * const shortLink = await prisma.shortLink.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ShortLinkFindFirstOrThrowArgs>(args?: SelectSubset<T, ShortLinkFindFirstOrThrowArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ShortLinks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ShortLinks
     * const shortLinks = await prisma.shortLink.findMany()
     * 
     * // Get first 10 ShortLinks
     * const shortLinks = await prisma.shortLink.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const shortLinkWithIdOnly = await prisma.shortLink.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ShortLinkFindManyArgs>(args?: SelectSubset<T, ShortLinkFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ShortLink.
     * @param {ShortLinkCreateArgs} args - Arguments to create a ShortLink.
     * @example
     * // Create one ShortLink
     * const ShortLink = await prisma.shortLink.create({
     *   data: {
     *     // ... data to create a ShortLink
     *   }
     * })
     * 
     */
    create<T extends ShortLinkCreateArgs>(args: SelectSubset<T, ShortLinkCreateArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ShortLinks.
     * @param {ShortLinkCreateManyArgs} args - Arguments to create many ShortLinks.
     * @example
     * // Create many ShortLinks
     * const shortLink = await prisma.shortLink.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ShortLinkCreateManyArgs>(args?: SelectSubset<T, ShortLinkCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ShortLinks and returns the data saved in the database.
     * @param {ShortLinkCreateManyAndReturnArgs} args - Arguments to create many ShortLinks.
     * @example
     * // Create many ShortLinks
     * const shortLink = await prisma.shortLink.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ShortLinks and only return the `id`
     * const shortLinkWithIdOnly = await prisma.shortLink.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ShortLinkCreateManyAndReturnArgs>(args?: SelectSubset<T, ShortLinkCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ShortLink.
     * @param {ShortLinkDeleteArgs} args - Arguments to delete one ShortLink.
     * @example
     * // Delete one ShortLink
     * const ShortLink = await prisma.shortLink.delete({
     *   where: {
     *     // ... filter to delete one ShortLink
     *   }
     * })
     * 
     */
    delete<T extends ShortLinkDeleteArgs>(args: SelectSubset<T, ShortLinkDeleteArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ShortLink.
     * @param {ShortLinkUpdateArgs} args - Arguments to update one ShortLink.
     * @example
     * // Update one ShortLink
     * const shortLink = await prisma.shortLink.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ShortLinkUpdateArgs>(args: SelectSubset<T, ShortLinkUpdateArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ShortLinks.
     * @param {ShortLinkDeleteManyArgs} args - Arguments to filter ShortLinks to delete.
     * @example
     * // Delete a few ShortLinks
     * const { count } = await prisma.shortLink.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ShortLinkDeleteManyArgs>(args?: SelectSubset<T, ShortLinkDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ShortLinks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ShortLinks
     * const shortLink = await prisma.shortLink.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ShortLinkUpdateManyArgs>(args: SelectSubset<T, ShortLinkUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ShortLinks and returns the data updated in the database.
     * @param {ShortLinkUpdateManyAndReturnArgs} args - Arguments to update many ShortLinks.
     * @example
     * // Update many ShortLinks
     * const shortLink = await prisma.shortLink.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ShortLinks and only return the `id`
     * const shortLinkWithIdOnly = await prisma.shortLink.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ShortLinkUpdateManyAndReturnArgs>(args: SelectSubset<T, ShortLinkUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ShortLink.
     * @param {ShortLinkUpsertArgs} args - Arguments to update or create a ShortLink.
     * @example
     * // Update or create a ShortLink
     * const shortLink = await prisma.shortLink.upsert({
     *   create: {
     *     // ... data to create a ShortLink
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ShortLink we want to update
     *   }
     * })
     */
    upsert<T extends ShortLinkUpsertArgs>(args: SelectSubset<T, ShortLinkUpsertArgs<ExtArgs>>): Prisma__ShortLinkClient<$Result.GetResult<Prisma.$ShortLinkPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ShortLinks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkCountArgs} args - Arguments to filter ShortLinks to count.
     * @example
     * // Count the number of ShortLinks
     * const count = await prisma.shortLink.count({
     *   where: {
     *     // ... the filter for the ShortLinks we want to count
     *   }
     * })
    **/
    count<T extends ShortLinkCountArgs>(
      args?: Subset<T, ShortLinkCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ShortLinkCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ShortLink.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ShortLinkAggregateArgs>(args: Subset<T, ShortLinkAggregateArgs>): Prisma.PrismaPromise<GetShortLinkAggregateType<T>>

    /**
     * Group by ShortLink.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortLinkGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ShortLinkGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ShortLinkGroupByArgs['orderBy'] }
        : { orderBy?: ShortLinkGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ShortLinkGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetShortLinkGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ShortLink model
   */
  readonly fields: ShortLinkFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ShortLink.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ShortLinkClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ShortLink model
   */
  interface ShortLinkFieldRefs {
    readonly id: FieldRef<"ShortLink", 'String'>
    readonly url: FieldRef<"ShortLink", 'String'>
    readonly createdAt: FieldRef<"ShortLink", 'DateTime'>
    readonly clicks: FieldRef<"ShortLink", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ShortLink findUnique
   */
  export type ShortLinkFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * Filter, which ShortLink to fetch.
     */
    where: ShortLinkWhereUniqueInput
  }

  /**
   * ShortLink findUniqueOrThrow
   */
  export type ShortLinkFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * Filter, which ShortLink to fetch.
     */
    where: ShortLinkWhereUniqueInput
  }

  /**
   * ShortLink findFirst
   */
  export type ShortLinkFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * Filter, which ShortLink to fetch.
     */
    where?: ShortLinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortLinks to fetch.
     */
    orderBy?: ShortLinkOrderByWithRelationInput | ShortLinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ShortLinks.
     */
    cursor?: ShortLinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortLinks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortLinks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortLinks.
     */
    distinct?: ShortLinkScalarFieldEnum | ShortLinkScalarFieldEnum[]
  }

  /**
   * ShortLink findFirstOrThrow
   */
  export type ShortLinkFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * Filter, which ShortLink to fetch.
     */
    where?: ShortLinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortLinks to fetch.
     */
    orderBy?: ShortLinkOrderByWithRelationInput | ShortLinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ShortLinks.
     */
    cursor?: ShortLinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortLinks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortLinks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortLinks.
     */
    distinct?: ShortLinkScalarFieldEnum | ShortLinkScalarFieldEnum[]
  }

  /**
   * ShortLink findMany
   */
  export type ShortLinkFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * Filter, which ShortLinks to fetch.
     */
    where?: ShortLinkWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ShortLinks to fetch.
     */
    orderBy?: ShortLinkOrderByWithRelationInput | ShortLinkOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ShortLinks.
     */
    cursor?: ShortLinkWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ShortLinks from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ShortLinks.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ShortLinks.
     */
    distinct?: ShortLinkScalarFieldEnum | ShortLinkScalarFieldEnum[]
  }

  /**
   * ShortLink create
   */
  export type ShortLinkCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * The data needed to create a ShortLink.
     */
    data: XOR<ShortLinkCreateInput, ShortLinkUncheckedCreateInput>
  }

  /**
   * ShortLink createMany
   */
  export type ShortLinkCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ShortLinks.
     */
    data: ShortLinkCreateManyInput | ShortLinkCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ShortLink createManyAndReturn
   */
  export type ShortLinkCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * The data used to create many ShortLinks.
     */
    data: ShortLinkCreateManyInput | ShortLinkCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ShortLink update
   */
  export type ShortLinkUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * The data needed to update a ShortLink.
     */
    data: XOR<ShortLinkUpdateInput, ShortLinkUncheckedUpdateInput>
    /**
     * Choose, which ShortLink to update.
     */
    where: ShortLinkWhereUniqueInput
  }

  /**
   * ShortLink updateMany
   */
  export type ShortLinkUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ShortLinks.
     */
    data: XOR<ShortLinkUpdateManyMutationInput, ShortLinkUncheckedUpdateManyInput>
    /**
     * Filter which ShortLinks to update
     */
    where?: ShortLinkWhereInput
    /**
     * Limit how many ShortLinks to update.
     */
    limit?: number
  }

  /**
   * ShortLink updateManyAndReturn
   */
  export type ShortLinkUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * The data used to update ShortLinks.
     */
    data: XOR<ShortLinkUpdateManyMutationInput, ShortLinkUncheckedUpdateManyInput>
    /**
     * Filter which ShortLinks to update
     */
    where?: ShortLinkWhereInput
    /**
     * Limit how many ShortLinks to update.
     */
    limit?: number
  }

  /**
   * ShortLink upsert
   */
  export type ShortLinkUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * The filter to search for the ShortLink to update in case it exists.
     */
    where: ShortLinkWhereUniqueInput
    /**
     * In case the ShortLink found by the `where` argument doesn't exist, create a new ShortLink with this data.
     */
    create: XOR<ShortLinkCreateInput, ShortLinkUncheckedCreateInput>
    /**
     * In case the ShortLink was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ShortLinkUpdateInput, ShortLinkUncheckedUpdateInput>
  }

  /**
   * ShortLink delete
   */
  export type ShortLinkDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
    /**
     * Filter which ShortLink to delete.
     */
    where: ShortLinkWhereUniqueInput
  }

  /**
   * ShortLink deleteMany
   */
  export type ShortLinkDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ShortLinks to delete
     */
    where?: ShortLinkWhereInput
    /**
     * Limit how many ShortLinks to delete.
     */
    limit?: number
  }

  /**
   * ShortLink without action
   */
  export type ShortLinkDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortLink
     */
    select?: ShortLinkSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ShortLink
     */
    omit?: ShortLinkOmit<ExtArgs> | null
  }


  /**
   * Model BikeHire
   */

  export type AggregateBikeHire = {
    _count: BikeHireCountAggregateOutputType | null
    _avg: BikeHireAvgAggregateOutputType | null
    _sum: BikeHireSumAggregateOutputType | null
    _min: BikeHireMinAggregateOutputType | null
    _max: BikeHireMaxAggregateOutputType | null
  }

  export type BikeHireAvgAggregateOutputType = {
    amount: number | null
  }

  export type BikeHireSumAggregateOutputType = {
    amount: number | null
  }

  export type BikeHireMinAggregateOutputType = {
    id: string | null
    registrationId: string | null
    bikeType: string | null
    status: string | null
    amount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BikeHireMaxAggregateOutputType = {
    id: string | null
    registrationId: string | null
    bikeType: string | null
    status: string | null
    amount: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BikeHireCountAggregateOutputType = {
    id: number
    registrationId: number
    bikeType: number
    status: number
    amount: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BikeHireAvgAggregateInputType = {
    amount?: true
  }

  export type BikeHireSumAggregateInputType = {
    amount?: true
  }

  export type BikeHireMinAggregateInputType = {
    id?: true
    registrationId?: true
    bikeType?: true
    status?: true
    amount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BikeHireMaxAggregateInputType = {
    id?: true
    registrationId?: true
    bikeType?: true
    status?: true
    amount?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BikeHireCountAggregateInputType = {
    id?: true
    registrationId?: true
    bikeType?: true
    status?: true
    amount?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BikeHireAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BikeHire to aggregate.
     */
    where?: BikeHireWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BikeHires to fetch.
     */
    orderBy?: BikeHireOrderByWithRelationInput | BikeHireOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BikeHireWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BikeHires from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BikeHires.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BikeHires
    **/
    _count?: true | BikeHireCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BikeHireAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BikeHireSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BikeHireMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BikeHireMaxAggregateInputType
  }

  export type GetBikeHireAggregateType<T extends BikeHireAggregateArgs> = {
        [P in keyof T & keyof AggregateBikeHire]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBikeHire[P]>
      : GetScalarType<T[P], AggregateBikeHire[P]>
  }




  export type BikeHireGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BikeHireWhereInput
    orderBy?: BikeHireOrderByWithAggregationInput | BikeHireOrderByWithAggregationInput[]
    by: BikeHireScalarFieldEnum[] | BikeHireScalarFieldEnum
    having?: BikeHireScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BikeHireCountAggregateInputType | true
    _avg?: BikeHireAvgAggregateInputType
    _sum?: BikeHireSumAggregateInputType
    _min?: BikeHireMinAggregateInputType
    _max?: BikeHireMaxAggregateInputType
  }

  export type BikeHireGroupByOutputType = {
    id: string
    registrationId: string
    bikeType: string
    status: string
    amount: number
    createdAt: Date
    updatedAt: Date
    _count: BikeHireCountAggregateOutputType | null
    _avg: BikeHireAvgAggregateOutputType | null
    _sum: BikeHireSumAggregateOutputType | null
    _min: BikeHireMinAggregateOutputType | null
    _max: BikeHireMaxAggregateOutputType | null
  }

  type GetBikeHireGroupByPayload<T extends BikeHireGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BikeHireGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BikeHireGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BikeHireGroupByOutputType[P]>
            : GetScalarType<T[P], BikeHireGroupByOutputType[P]>
        }
      >
    >


  export type BikeHireSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    bikeType?: boolean
    status?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    registration?: boolean | RegistrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["bikeHire"]>

  export type BikeHireSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    bikeType?: boolean
    status?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    registration?: boolean | RegistrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["bikeHire"]>

  export type BikeHireSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    registrationId?: boolean
    bikeType?: boolean
    status?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    registration?: boolean | RegistrationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["bikeHire"]>

  export type BikeHireSelectScalar = {
    id?: boolean
    registrationId?: boolean
    bikeType?: boolean
    status?: boolean
    amount?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BikeHireOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "registrationId" | "bikeType" | "status" | "amount" | "createdAt" | "updatedAt", ExtArgs["result"]["bikeHire"]>
  export type BikeHireInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    registration?: boolean | RegistrationDefaultArgs<ExtArgs>
  }
  export type BikeHireIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    registration?: boolean | RegistrationDefaultArgs<ExtArgs>
  }
  export type BikeHireIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    registration?: boolean | RegistrationDefaultArgs<ExtArgs>
  }

  export type $BikeHirePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BikeHire"
    objects: {
      registration: Prisma.$RegistrationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      registrationId: string
      bikeType: string
      status: string
      amount: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["bikeHire"]>
    composites: {}
  }

  type BikeHireGetPayload<S extends boolean | null | undefined | BikeHireDefaultArgs> = $Result.GetResult<Prisma.$BikeHirePayload, S>

  type BikeHireCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BikeHireFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BikeHireCountAggregateInputType | true
    }

  export interface BikeHireDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BikeHire'], meta: { name: 'BikeHire' } }
    /**
     * Find zero or one BikeHire that matches the filter.
     * @param {BikeHireFindUniqueArgs} args - Arguments to find a BikeHire
     * @example
     * // Get one BikeHire
     * const bikeHire = await prisma.bikeHire.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BikeHireFindUniqueArgs>(args: SelectSubset<T, BikeHireFindUniqueArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BikeHire that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BikeHireFindUniqueOrThrowArgs} args - Arguments to find a BikeHire
     * @example
     * // Get one BikeHire
     * const bikeHire = await prisma.bikeHire.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BikeHireFindUniqueOrThrowArgs>(args: SelectSubset<T, BikeHireFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BikeHire that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireFindFirstArgs} args - Arguments to find a BikeHire
     * @example
     * // Get one BikeHire
     * const bikeHire = await prisma.bikeHire.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BikeHireFindFirstArgs>(args?: SelectSubset<T, BikeHireFindFirstArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BikeHire that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireFindFirstOrThrowArgs} args - Arguments to find a BikeHire
     * @example
     * // Get one BikeHire
     * const bikeHire = await prisma.bikeHire.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BikeHireFindFirstOrThrowArgs>(args?: SelectSubset<T, BikeHireFindFirstOrThrowArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BikeHires that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BikeHires
     * const bikeHires = await prisma.bikeHire.findMany()
     * 
     * // Get first 10 BikeHires
     * const bikeHires = await prisma.bikeHire.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const bikeHireWithIdOnly = await prisma.bikeHire.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BikeHireFindManyArgs>(args?: SelectSubset<T, BikeHireFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BikeHire.
     * @param {BikeHireCreateArgs} args - Arguments to create a BikeHire.
     * @example
     * // Create one BikeHire
     * const BikeHire = await prisma.bikeHire.create({
     *   data: {
     *     // ... data to create a BikeHire
     *   }
     * })
     * 
     */
    create<T extends BikeHireCreateArgs>(args: SelectSubset<T, BikeHireCreateArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BikeHires.
     * @param {BikeHireCreateManyArgs} args - Arguments to create many BikeHires.
     * @example
     * // Create many BikeHires
     * const bikeHire = await prisma.bikeHire.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BikeHireCreateManyArgs>(args?: SelectSubset<T, BikeHireCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BikeHires and returns the data saved in the database.
     * @param {BikeHireCreateManyAndReturnArgs} args - Arguments to create many BikeHires.
     * @example
     * // Create many BikeHires
     * const bikeHire = await prisma.bikeHire.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BikeHires and only return the `id`
     * const bikeHireWithIdOnly = await prisma.bikeHire.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BikeHireCreateManyAndReturnArgs>(args?: SelectSubset<T, BikeHireCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BikeHire.
     * @param {BikeHireDeleteArgs} args - Arguments to delete one BikeHire.
     * @example
     * // Delete one BikeHire
     * const BikeHire = await prisma.bikeHire.delete({
     *   where: {
     *     // ... filter to delete one BikeHire
     *   }
     * })
     * 
     */
    delete<T extends BikeHireDeleteArgs>(args: SelectSubset<T, BikeHireDeleteArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BikeHire.
     * @param {BikeHireUpdateArgs} args - Arguments to update one BikeHire.
     * @example
     * // Update one BikeHire
     * const bikeHire = await prisma.bikeHire.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BikeHireUpdateArgs>(args: SelectSubset<T, BikeHireUpdateArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BikeHires.
     * @param {BikeHireDeleteManyArgs} args - Arguments to filter BikeHires to delete.
     * @example
     * // Delete a few BikeHires
     * const { count } = await prisma.bikeHire.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BikeHireDeleteManyArgs>(args?: SelectSubset<T, BikeHireDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BikeHires.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BikeHires
     * const bikeHire = await prisma.bikeHire.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BikeHireUpdateManyArgs>(args: SelectSubset<T, BikeHireUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BikeHires and returns the data updated in the database.
     * @param {BikeHireUpdateManyAndReturnArgs} args - Arguments to update many BikeHires.
     * @example
     * // Update many BikeHires
     * const bikeHire = await prisma.bikeHire.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BikeHires and only return the `id`
     * const bikeHireWithIdOnly = await prisma.bikeHire.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BikeHireUpdateManyAndReturnArgs>(args: SelectSubset<T, BikeHireUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BikeHire.
     * @param {BikeHireUpsertArgs} args - Arguments to update or create a BikeHire.
     * @example
     * // Update or create a BikeHire
     * const bikeHire = await prisma.bikeHire.upsert({
     *   create: {
     *     // ... data to create a BikeHire
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BikeHire we want to update
     *   }
     * })
     */
    upsert<T extends BikeHireUpsertArgs>(args: SelectSubset<T, BikeHireUpsertArgs<ExtArgs>>): Prisma__BikeHireClient<$Result.GetResult<Prisma.$BikeHirePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BikeHires.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireCountArgs} args - Arguments to filter BikeHires to count.
     * @example
     * // Count the number of BikeHires
     * const count = await prisma.bikeHire.count({
     *   where: {
     *     // ... the filter for the BikeHires we want to count
     *   }
     * })
    **/
    count<T extends BikeHireCountArgs>(
      args?: Subset<T, BikeHireCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BikeHireCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BikeHire.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BikeHireAggregateArgs>(args: Subset<T, BikeHireAggregateArgs>): Prisma.PrismaPromise<GetBikeHireAggregateType<T>>

    /**
     * Group by BikeHire.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BikeHireGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BikeHireGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BikeHireGroupByArgs['orderBy'] }
        : { orderBy?: BikeHireGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BikeHireGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBikeHireGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BikeHire model
   */
  readonly fields: BikeHireFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BikeHire.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BikeHireClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    registration<T extends RegistrationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, RegistrationDefaultArgs<ExtArgs>>): Prisma__RegistrationClient<$Result.GetResult<Prisma.$RegistrationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BikeHire model
   */
  interface BikeHireFieldRefs {
    readonly id: FieldRef<"BikeHire", 'String'>
    readonly registrationId: FieldRef<"BikeHire", 'String'>
    readonly bikeType: FieldRef<"BikeHire", 'String'>
    readonly status: FieldRef<"BikeHire", 'String'>
    readonly amount: FieldRef<"BikeHire", 'Float'>
    readonly createdAt: FieldRef<"BikeHire", 'DateTime'>
    readonly updatedAt: FieldRef<"BikeHire", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BikeHire findUnique
   */
  export type BikeHireFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * Filter, which BikeHire to fetch.
     */
    where: BikeHireWhereUniqueInput
  }

  /**
   * BikeHire findUniqueOrThrow
   */
  export type BikeHireFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * Filter, which BikeHire to fetch.
     */
    where: BikeHireWhereUniqueInput
  }

  /**
   * BikeHire findFirst
   */
  export type BikeHireFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * Filter, which BikeHire to fetch.
     */
    where?: BikeHireWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BikeHires to fetch.
     */
    orderBy?: BikeHireOrderByWithRelationInput | BikeHireOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BikeHires.
     */
    cursor?: BikeHireWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BikeHires from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BikeHires.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BikeHires.
     */
    distinct?: BikeHireScalarFieldEnum | BikeHireScalarFieldEnum[]
  }

  /**
   * BikeHire findFirstOrThrow
   */
  export type BikeHireFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * Filter, which BikeHire to fetch.
     */
    where?: BikeHireWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BikeHires to fetch.
     */
    orderBy?: BikeHireOrderByWithRelationInput | BikeHireOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BikeHires.
     */
    cursor?: BikeHireWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BikeHires from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BikeHires.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BikeHires.
     */
    distinct?: BikeHireScalarFieldEnum | BikeHireScalarFieldEnum[]
  }

  /**
   * BikeHire findMany
   */
  export type BikeHireFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * Filter, which BikeHires to fetch.
     */
    where?: BikeHireWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BikeHires to fetch.
     */
    orderBy?: BikeHireOrderByWithRelationInput | BikeHireOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BikeHires.
     */
    cursor?: BikeHireWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BikeHires from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BikeHires.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BikeHires.
     */
    distinct?: BikeHireScalarFieldEnum | BikeHireScalarFieldEnum[]
  }

  /**
   * BikeHire create
   */
  export type BikeHireCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * The data needed to create a BikeHire.
     */
    data: XOR<BikeHireCreateInput, BikeHireUncheckedCreateInput>
  }

  /**
   * BikeHire createMany
   */
  export type BikeHireCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BikeHires.
     */
    data: BikeHireCreateManyInput | BikeHireCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BikeHire createManyAndReturn
   */
  export type BikeHireCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * The data used to create many BikeHires.
     */
    data: BikeHireCreateManyInput | BikeHireCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BikeHire update
   */
  export type BikeHireUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * The data needed to update a BikeHire.
     */
    data: XOR<BikeHireUpdateInput, BikeHireUncheckedUpdateInput>
    /**
     * Choose, which BikeHire to update.
     */
    where: BikeHireWhereUniqueInput
  }

  /**
   * BikeHire updateMany
   */
  export type BikeHireUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BikeHires.
     */
    data: XOR<BikeHireUpdateManyMutationInput, BikeHireUncheckedUpdateManyInput>
    /**
     * Filter which BikeHires to update
     */
    where?: BikeHireWhereInput
    /**
     * Limit how many BikeHires to update.
     */
    limit?: number
  }

  /**
   * BikeHire updateManyAndReturn
   */
  export type BikeHireUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * The data used to update BikeHires.
     */
    data: XOR<BikeHireUpdateManyMutationInput, BikeHireUncheckedUpdateManyInput>
    /**
     * Filter which BikeHires to update
     */
    where?: BikeHireWhereInput
    /**
     * Limit how many BikeHires to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * BikeHire upsert
   */
  export type BikeHireUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * The filter to search for the BikeHire to update in case it exists.
     */
    where: BikeHireWhereUniqueInput
    /**
     * In case the BikeHire found by the `where` argument doesn't exist, create a new BikeHire with this data.
     */
    create: XOR<BikeHireCreateInput, BikeHireUncheckedCreateInput>
    /**
     * In case the BikeHire was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BikeHireUpdateInput, BikeHireUncheckedUpdateInput>
  }

  /**
   * BikeHire delete
   */
  export type BikeHireDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
    /**
     * Filter which BikeHire to delete.
     */
    where: BikeHireWhereUniqueInput
  }

  /**
   * BikeHire deleteMany
   */
  export type BikeHireDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BikeHires to delete
     */
    where?: BikeHireWhereInput
    /**
     * Limit how many BikeHires to delete.
     */
    limit?: number
  }

  /**
   * BikeHire without action
   */
  export type BikeHireDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BikeHire
     */
    select?: BikeHireSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BikeHire
     */
    omit?: BikeHireOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BikeHireInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const RegistrationScalarFieldEnum: {
    id: 'id',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    circuitId: 'circuitId',
    type: 'type',
    status: 'status',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phoneNumber: 'phoneNumber',
    idNumber: 'idNumber',
    dob: 'dob',
    gender: 'gender',
    groupId: 'groupId',
    teamName: 'teamName',
    isCaptain: 'isCaptain',
    guardianName: 'guardianName',
    emergencyPhone: 'emergencyPhone',
    relationship: 'relationship',
    category: 'category',
    totalAmount: 'totalAmount',
    payload: 'payload',
    pricing: 'pricing',
    classifications: 'classifications',
    emergencyContactName: 'emergencyContactName',
    tshirtSize: 'tshirtSize',
    mpesaCode: 'mpesaCode',
    isMilitary: 'isMilitary',
    rank: 'rank',
    service: 'service',
    serviceNumber: 'serviceNumber',
    unit: 'unit'
  };

  export type RegistrationScalarFieldEnum = (typeof RegistrationScalarFieldEnum)[keyof typeof RegistrationScalarFieldEnum]


  export const AdminScalarFieldEnum: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    name: 'name',
    role: 'role',
    createdAt: 'createdAt',
    lastLogin: 'lastLogin'
  };

  export type AdminScalarFieldEnum = (typeof AdminScalarFieldEnum)[keyof typeof AdminScalarFieldEnum]


  export const AdminSessionScalarFieldEnum: {
    id: 'id',
    adminId: 'adminId',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type AdminSessionScalarFieldEnum = (typeof AdminSessionScalarFieldEnum)[keyof typeof AdminSessionScalarFieldEnum]


  export const PaymentScalarFieldEnum: {
    id: 'id',
    registrationId: 'registrationId',
    raffleTicketIds: 'raffleTicketIds',
    donationId: 'donationId',
    checkoutRequestId: 'checkoutRequestId',
    merchantRequestId: 'merchantRequestId',
    phone: 'phone',
    amount: 'amount',
    status: 'status',
    failureReason: 'failureReason',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    mpesaReceiptNumber: 'mpesaReceiptNumber',
    transactionDate: 'transactionDate',
    mnoReference: 'mnoReference',
    cbsReference: 'cbsReference',
    paymentDetails: 'paymentDetails'
  };

  export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum]


  export const PricingCategoryScalarFieldEnum: {
    id: 'id',
    circuitId: 'circuitId',
    type: 'type',
    familyCategory: 'familyCategory',
    minAge: 'minAge',
    maxAge: 'maxAge',
    categoryName: 'categoryName',
    regRange: 'regRange',
    price: 'price',
    colorCode: 'colorCode',
    hexColor: 'hexColor',
    remarks: 'remarks',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PricingCategoryScalarFieldEnum = (typeof PricingCategoryScalarFieldEnum)[keyof typeof PricingCategoryScalarFieldEnum]


  export const EmailLogScalarFieldEnum: {
    id: 'id',
    registrationId: 'registrationId',
    type: 'type',
    sentAt: 'sentAt',
    status: 'status',
    error: 'error'
  };

  export type EmailLogScalarFieldEnum = (typeof EmailLogScalarFieldEnum)[keyof typeof EmailLogScalarFieldEnum]


  export const RaffleTicketScalarFieldEnum: {
    id: 'id',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phoneNumber: 'phoneNumber',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    checkoutRequestId: 'checkoutRequestId',
    paymentFailed: 'paymentFailed',
    gender: 'gender',
    idNumber: 'idNumber',
    failureReason: 'failureReason',
    mpesaCode: 'mpesaCode',
    paymentDetails: 'paymentDetails',
    referralCode: 'referralCode'
  };

  export type RaffleTicketScalarFieldEnum = (typeof RaffleTicketScalarFieldEnum)[keyof typeof RaffleTicketScalarFieldEnum]


  export const ReferralScalarFieldEnum: {
    id: 'id',
    code: 'code',
    influencerName: 'influencerName',
    influencerEmail: 'influencerEmail',
    influencerPhone: 'influencerPhone',
    isActive: 'isActive',
    clicks: 'clicks',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReferralScalarFieldEnum = (typeof ReferralScalarFieldEnum)[keyof typeof ReferralScalarFieldEnum]


  export const DonationScalarFieldEnum: {
    id: 'id',
    amount: 'amount',
    name: 'name',
    email: 'email',
    phone: 'phone',
    status: 'status',
    checkoutRequestId: 'checkoutRequestId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    failureReason: 'failureReason',
    mpesaCode: 'mpesaCode',
    paymentDetails: 'paymentDetails'
  };

  export type DonationScalarFieldEnum = (typeof DonationScalarFieldEnum)[keyof typeof DonationScalarFieldEnum]


  export const SmsLogScalarFieldEnum: {
    id: 'id',
    phoneNumber: 'phoneNumber',
    message: 'message',
    status: 'status',
    messageId: 'messageId',
    cost: 'cost',
    sentAt: 'sentAt'
  };

  export type SmsLogScalarFieldEnum = (typeof SmsLogScalarFieldEnum)[keyof typeof SmsLogScalarFieldEnum]


  export const ShortLinkScalarFieldEnum: {
    id: 'id',
    url: 'url',
    createdAt: 'createdAt',
    clicks: 'clicks'
  };

  export type ShortLinkScalarFieldEnum = (typeof ShortLinkScalarFieldEnum)[keyof typeof ShortLinkScalarFieldEnum]


  export const BikeHireScalarFieldEnum: {
    id: 'id',
    registrationId: 'registrationId',
    bikeType: 'bikeType',
    status: 'status',
    amount: 'amount',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BikeHireScalarFieldEnum = (typeof BikeHireScalarFieldEnum)[keyof typeof BikeHireScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'RegistrationStatus'
   */
  export type EnumRegistrationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RegistrationStatus'>
    


  /**
   * Reference to a field of type 'RegistrationStatus[]'
   */
  export type ListEnumRegistrationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RegistrationStatus[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type RegistrationWhereInput = {
    AND?: RegistrationWhereInput | RegistrationWhereInput[]
    OR?: RegistrationWhereInput[]
    NOT?: RegistrationWhereInput | RegistrationWhereInput[]
    id?: StringFilter<"Registration"> | string
    createdAt?: DateTimeFilter<"Registration"> | Date | string
    updatedAt?: DateTimeFilter<"Registration"> | Date | string
    circuitId?: StringFilter<"Registration"> | string
    type?: StringFilter<"Registration"> | string
    status?: EnumRegistrationStatusFilter<"Registration"> | $Enums.RegistrationStatus
    firstName?: StringFilter<"Registration"> | string
    lastName?: StringFilter<"Registration"> | string
    email?: StringNullableFilter<"Registration"> | string | null
    phoneNumber?: StringNullableFilter<"Registration"> | string | null
    idNumber?: StringNullableFilter<"Registration"> | string | null
    dob?: StringNullableFilter<"Registration"> | string | null
    gender?: StringNullableFilter<"Registration"> | string | null
    groupId?: StringNullableFilter<"Registration"> | string | null
    teamName?: StringNullableFilter<"Registration"> | string | null
    isCaptain?: BoolFilter<"Registration"> | boolean
    guardianName?: StringNullableFilter<"Registration"> | string | null
    emergencyPhone?: StringNullableFilter<"Registration"> | string | null
    relationship?: StringNullableFilter<"Registration"> | string | null
    category?: StringNullableFilter<"Registration"> | string | null
    totalAmount?: FloatFilter<"Registration"> | number
    payload?: JsonNullableFilter<"Registration">
    pricing?: JsonNullableFilter<"Registration">
    classifications?: JsonNullableFilter<"Registration">
    emergencyContactName?: StringNullableFilter<"Registration"> | string | null
    tshirtSize?: StringNullableFilter<"Registration"> | string | null
    mpesaCode?: StringNullableFilter<"Registration"> | string | null
    isMilitary?: BoolFilter<"Registration"> | boolean
    rank?: StringNullableFilter<"Registration"> | string | null
    service?: StringNullableFilter<"Registration"> | string | null
    serviceNumber?: StringNullableFilter<"Registration"> | string | null
    unit?: StringNullableFilter<"Registration"> | string | null
    bikeHire?: XOR<BikeHireNullableScalarRelationFilter, BikeHireWhereInput> | null
  }

  export type RegistrationOrderByWithRelationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrderInput | SortOrder
    phoneNumber?: SortOrderInput | SortOrder
    idNumber?: SortOrderInput | SortOrder
    dob?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    groupId?: SortOrderInput | SortOrder
    teamName?: SortOrderInput | SortOrder
    isCaptain?: SortOrder
    guardianName?: SortOrderInput | SortOrder
    emergencyPhone?: SortOrderInput | SortOrder
    relationship?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    totalAmount?: SortOrder
    payload?: SortOrderInput | SortOrder
    pricing?: SortOrderInput | SortOrder
    classifications?: SortOrderInput | SortOrder
    emergencyContactName?: SortOrderInput | SortOrder
    tshirtSize?: SortOrderInput | SortOrder
    mpesaCode?: SortOrderInput | SortOrder
    isMilitary?: SortOrder
    rank?: SortOrderInput | SortOrder
    service?: SortOrderInput | SortOrder
    serviceNumber?: SortOrderInput | SortOrder
    unit?: SortOrderInput | SortOrder
    bikeHire?: BikeHireOrderByWithRelationInput
  }

  export type RegistrationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RegistrationWhereInput | RegistrationWhereInput[]
    OR?: RegistrationWhereInput[]
    NOT?: RegistrationWhereInput | RegistrationWhereInput[]
    createdAt?: DateTimeFilter<"Registration"> | Date | string
    updatedAt?: DateTimeFilter<"Registration"> | Date | string
    circuitId?: StringFilter<"Registration"> | string
    type?: StringFilter<"Registration"> | string
    status?: EnumRegistrationStatusFilter<"Registration"> | $Enums.RegistrationStatus
    firstName?: StringFilter<"Registration"> | string
    lastName?: StringFilter<"Registration"> | string
    email?: StringNullableFilter<"Registration"> | string | null
    phoneNumber?: StringNullableFilter<"Registration"> | string | null
    idNumber?: StringNullableFilter<"Registration"> | string | null
    dob?: StringNullableFilter<"Registration"> | string | null
    gender?: StringNullableFilter<"Registration"> | string | null
    groupId?: StringNullableFilter<"Registration"> | string | null
    teamName?: StringNullableFilter<"Registration"> | string | null
    isCaptain?: BoolFilter<"Registration"> | boolean
    guardianName?: StringNullableFilter<"Registration"> | string | null
    emergencyPhone?: StringNullableFilter<"Registration"> | string | null
    relationship?: StringNullableFilter<"Registration"> | string | null
    category?: StringNullableFilter<"Registration"> | string | null
    totalAmount?: FloatFilter<"Registration"> | number
    payload?: JsonNullableFilter<"Registration">
    pricing?: JsonNullableFilter<"Registration">
    classifications?: JsonNullableFilter<"Registration">
    emergencyContactName?: StringNullableFilter<"Registration"> | string | null
    tshirtSize?: StringNullableFilter<"Registration"> | string | null
    mpesaCode?: StringNullableFilter<"Registration"> | string | null
    isMilitary?: BoolFilter<"Registration"> | boolean
    rank?: StringNullableFilter<"Registration"> | string | null
    service?: StringNullableFilter<"Registration"> | string | null
    serviceNumber?: StringNullableFilter<"Registration"> | string | null
    unit?: StringNullableFilter<"Registration"> | string | null
    bikeHire?: XOR<BikeHireNullableScalarRelationFilter, BikeHireWhereInput> | null
  }, "id">

  export type RegistrationOrderByWithAggregationInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrderInput | SortOrder
    phoneNumber?: SortOrderInput | SortOrder
    idNumber?: SortOrderInput | SortOrder
    dob?: SortOrderInput | SortOrder
    gender?: SortOrderInput | SortOrder
    groupId?: SortOrderInput | SortOrder
    teamName?: SortOrderInput | SortOrder
    isCaptain?: SortOrder
    guardianName?: SortOrderInput | SortOrder
    emergencyPhone?: SortOrderInput | SortOrder
    relationship?: SortOrderInput | SortOrder
    category?: SortOrderInput | SortOrder
    totalAmount?: SortOrder
    payload?: SortOrderInput | SortOrder
    pricing?: SortOrderInput | SortOrder
    classifications?: SortOrderInput | SortOrder
    emergencyContactName?: SortOrderInput | SortOrder
    tshirtSize?: SortOrderInput | SortOrder
    mpesaCode?: SortOrderInput | SortOrder
    isMilitary?: SortOrder
    rank?: SortOrderInput | SortOrder
    service?: SortOrderInput | SortOrder
    serviceNumber?: SortOrderInput | SortOrder
    unit?: SortOrderInput | SortOrder
    _count?: RegistrationCountOrderByAggregateInput
    _avg?: RegistrationAvgOrderByAggregateInput
    _max?: RegistrationMaxOrderByAggregateInput
    _min?: RegistrationMinOrderByAggregateInput
    _sum?: RegistrationSumOrderByAggregateInput
  }

  export type RegistrationScalarWhereWithAggregatesInput = {
    AND?: RegistrationScalarWhereWithAggregatesInput | RegistrationScalarWhereWithAggregatesInput[]
    OR?: RegistrationScalarWhereWithAggregatesInput[]
    NOT?: RegistrationScalarWhereWithAggregatesInput | RegistrationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Registration"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Registration"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Registration"> | Date | string
    circuitId?: StringWithAggregatesFilter<"Registration"> | string
    type?: StringWithAggregatesFilter<"Registration"> | string
    status?: EnumRegistrationStatusWithAggregatesFilter<"Registration"> | $Enums.RegistrationStatus
    firstName?: StringWithAggregatesFilter<"Registration"> | string
    lastName?: StringWithAggregatesFilter<"Registration"> | string
    email?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    phoneNumber?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    idNumber?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    dob?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    gender?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    groupId?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    teamName?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    isCaptain?: BoolWithAggregatesFilter<"Registration"> | boolean
    guardianName?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    emergencyPhone?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    relationship?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    category?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    totalAmount?: FloatWithAggregatesFilter<"Registration"> | number
    payload?: JsonNullableWithAggregatesFilter<"Registration">
    pricing?: JsonNullableWithAggregatesFilter<"Registration">
    classifications?: JsonNullableWithAggregatesFilter<"Registration">
    emergencyContactName?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    tshirtSize?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    mpesaCode?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    isMilitary?: BoolWithAggregatesFilter<"Registration"> | boolean
    rank?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    service?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    serviceNumber?: StringNullableWithAggregatesFilter<"Registration"> | string | null
    unit?: StringNullableWithAggregatesFilter<"Registration"> | string | null
  }

  export type AdminWhereInput = {
    AND?: AdminWhereInput | AdminWhereInput[]
    OR?: AdminWhereInput[]
    NOT?: AdminWhereInput | AdminWhereInput[]
    id?: StringFilter<"Admin"> | string
    email?: StringFilter<"Admin"> | string
    passwordHash?: StringFilter<"Admin"> | string
    name?: StringFilter<"Admin"> | string
    role?: StringFilter<"Admin"> | string
    createdAt?: DateTimeFilter<"Admin"> | Date | string
    lastLogin?: DateTimeNullableFilter<"Admin"> | Date | string | null
    sessions?: AdminSessionListRelationFilter
  }

  export type AdminOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrderInput | SortOrder
    sessions?: AdminSessionOrderByRelationAggregateInput
  }

  export type AdminWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: AdminWhereInput | AdminWhereInput[]
    OR?: AdminWhereInput[]
    NOT?: AdminWhereInput | AdminWhereInput[]
    passwordHash?: StringFilter<"Admin"> | string
    name?: StringFilter<"Admin"> | string
    role?: StringFilter<"Admin"> | string
    createdAt?: DateTimeFilter<"Admin"> | Date | string
    lastLogin?: DateTimeNullableFilter<"Admin"> | Date | string | null
    sessions?: AdminSessionListRelationFilter
  }, "id" | "email">

  export type AdminOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrderInput | SortOrder
    _count?: AdminCountOrderByAggregateInput
    _max?: AdminMaxOrderByAggregateInput
    _min?: AdminMinOrderByAggregateInput
  }

  export type AdminScalarWhereWithAggregatesInput = {
    AND?: AdminScalarWhereWithAggregatesInput | AdminScalarWhereWithAggregatesInput[]
    OR?: AdminScalarWhereWithAggregatesInput[]
    NOT?: AdminScalarWhereWithAggregatesInput | AdminScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Admin"> | string
    email?: StringWithAggregatesFilter<"Admin"> | string
    passwordHash?: StringWithAggregatesFilter<"Admin"> | string
    name?: StringWithAggregatesFilter<"Admin"> | string
    role?: StringWithAggregatesFilter<"Admin"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Admin"> | Date | string
    lastLogin?: DateTimeNullableWithAggregatesFilter<"Admin"> | Date | string | null
  }

  export type AdminSessionWhereInput = {
    AND?: AdminSessionWhereInput | AdminSessionWhereInput[]
    OR?: AdminSessionWhereInput[]
    NOT?: AdminSessionWhereInput | AdminSessionWhereInput[]
    id?: StringFilter<"AdminSession"> | string
    adminId?: StringFilter<"AdminSession"> | string
    token?: StringFilter<"AdminSession"> | string
    expiresAt?: DateTimeFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeFilter<"AdminSession"> | Date | string
    admin?: XOR<AdminScalarRelationFilter, AdminWhereInput>
  }

  export type AdminSessionOrderByWithRelationInput = {
    id?: SortOrder
    adminId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    admin?: AdminOrderByWithRelationInput
  }

  export type AdminSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: AdminSessionWhereInput | AdminSessionWhereInput[]
    OR?: AdminSessionWhereInput[]
    NOT?: AdminSessionWhereInput | AdminSessionWhereInput[]
    adminId?: StringFilter<"AdminSession"> | string
    expiresAt?: DateTimeFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeFilter<"AdminSession"> | Date | string
    admin?: XOR<AdminScalarRelationFilter, AdminWhereInput>
  }, "id" | "token">

  export type AdminSessionOrderByWithAggregationInput = {
    id?: SortOrder
    adminId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: AdminSessionCountOrderByAggregateInput
    _max?: AdminSessionMaxOrderByAggregateInput
    _min?: AdminSessionMinOrderByAggregateInput
  }

  export type AdminSessionScalarWhereWithAggregatesInput = {
    AND?: AdminSessionScalarWhereWithAggregatesInput | AdminSessionScalarWhereWithAggregatesInput[]
    OR?: AdminSessionScalarWhereWithAggregatesInput[]
    NOT?: AdminSessionScalarWhereWithAggregatesInput | AdminSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AdminSession"> | string
    adminId?: StringWithAggregatesFilter<"AdminSession"> | string
    token?: StringWithAggregatesFilter<"AdminSession"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"AdminSession"> | Date | string
  }

  export type PaymentWhereInput = {
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    id?: StringFilter<"Payment"> | string
    registrationId?: StringNullableFilter<"Payment"> | string | null
    raffleTicketIds?: StringNullableListFilter<"Payment">
    donationId?: StringNullableFilter<"Payment"> | string | null
    checkoutRequestId?: StringNullableFilter<"Payment"> | string | null
    merchantRequestId?: StringNullableFilter<"Payment"> | string | null
    phone?: StringNullableFilter<"Payment"> | string | null
    amount?: FloatFilter<"Payment"> | number
    status?: StringFilter<"Payment"> | string
    failureReason?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    mpesaReceiptNumber?: StringNullableFilter<"Payment"> | string | null
    transactionDate?: StringNullableFilter<"Payment"> | string | null
    mnoReference?: StringNullableFilter<"Payment"> | string | null
    cbsReference?: StringNullableFilter<"Payment"> | string | null
    paymentDetails?: JsonNullableFilter<"Payment">
  }

  export type PaymentOrderByWithRelationInput = {
    id?: SortOrder
    registrationId?: SortOrderInput | SortOrder
    raffleTicketIds?: SortOrder
    donationId?: SortOrderInput | SortOrder
    checkoutRequestId?: SortOrderInput | SortOrder
    merchantRequestId?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    amount?: SortOrder
    status?: SortOrder
    failureReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    mpesaReceiptNumber?: SortOrderInput | SortOrder
    transactionDate?: SortOrderInput | SortOrder
    mnoReference?: SortOrderInput | SortOrder
    cbsReference?: SortOrderInput | SortOrder
    paymentDetails?: SortOrderInput | SortOrder
  }

  export type PaymentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    checkoutRequestId?: string
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    registrationId?: StringNullableFilter<"Payment"> | string | null
    raffleTicketIds?: StringNullableListFilter<"Payment">
    donationId?: StringNullableFilter<"Payment"> | string | null
    merchantRequestId?: StringNullableFilter<"Payment"> | string | null
    phone?: StringNullableFilter<"Payment"> | string | null
    amount?: FloatFilter<"Payment"> | number
    status?: StringFilter<"Payment"> | string
    failureReason?: StringNullableFilter<"Payment"> | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
    mpesaReceiptNumber?: StringNullableFilter<"Payment"> | string | null
    transactionDate?: StringNullableFilter<"Payment"> | string | null
    mnoReference?: StringNullableFilter<"Payment"> | string | null
    cbsReference?: StringNullableFilter<"Payment"> | string | null
    paymentDetails?: JsonNullableFilter<"Payment">
  }, "id" | "checkoutRequestId">

  export type PaymentOrderByWithAggregationInput = {
    id?: SortOrder
    registrationId?: SortOrderInput | SortOrder
    raffleTicketIds?: SortOrder
    donationId?: SortOrderInput | SortOrder
    checkoutRequestId?: SortOrderInput | SortOrder
    merchantRequestId?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    amount?: SortOrder
    status?: SortOrder
    failureReason?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    mpesaReceiptNumber?: SortOrderInput | SortOrder
    transactionDate?: SortOrderInput | SortOrder
    mnoReference?: SortOrderInput | SortOrder
    cbsReference?: SortOrderInput | SortOrder
    paymentDetails?: SortOrderInput | SortOrder
    _count?: PaymentCountOrderByAggregateInput
    _avg?: PaymentAvgOrderByAggregateInput
    _max?: PaymentMaxOrderByAggregateInput
    _min?: PaymentMinOrderByAggregateInput
    _sum?: PaymentSumOrderByAggregateInput
  }

  export type PaymentScalarWhereWithAggregatesInput = {
    AND?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    OR?: PaymentScalarWhereWithAggregatesInput[]
    NOT?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payment"> | string
    registrationId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    raffleTicketIds?: StringNullableListFilter<"Payment">
    donationId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    checkoutRequestId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    merchantRequestId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    phone?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    amount?: FloatWithAggregatesFilter<"Payment"> | number
    status?: StringWithAggregatesFilter<"Payment"> | string
    failureReason?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    mpesaReceiptNumber?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    transactionDate?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    mnoReference?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    cbsReference?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    paymentDetails?: JsonNullableWithAggregatesFilter<"Payment">
  }

  export type PricingCategoryWhereInput = {
    AND?: PricingCategoryWhereInput | PricingCategoryWhereInput[]
    OR?: PricingCategoryWhereInput[]
    NOT?: PricingCategoryWhereInput | PricingCategoryWhereInput[]
    id?: StringFilter<"PricingCategory"> | string
    circuitId?: StringFilter<"PricingCategory"> | string
    type?: StringFilter<"PricingCategory"> | string
    familyCategory?: StringNullableFilter<"PricingCategory"> | string | null
    minAge?: IntNullableFilter<"PricingCategory"> | number | null
    maxAge?: IntNullableFilter<"PricingCategory"> | number | null
    categoryName?: StringFilter<"PricingCategory"> | string
    regRange?: StringFilter<"PricingCategory"> | string
    price?: FloatFilter<"PricingCategory"> | number
    colorCode?: StringFilter<"PricingCategory"> | string
    hexColor?: StringFilter<"PricingCategory"> | string
    remarks?: StringNullableFilter<"PricingCategory"> | string | null
    createdAt?: DateTimeFilter<"PricingCategory"> | Date | string
    updatedAt?: DateTimeFilter<"PricingCategory"> | Date | string
  }

  export type PricingCategoryOrderByWithRelationInput = {
    id?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    familyCategory?: SortOrderInput | SortOrder
    minAge?: SortOrderInput | SortOrder
    maxAge?: SortOrderInput | SortOrder
    categoryName?: SortOrder
    regRange?: SortOrder
    price?: SortOrder
    colorCode?: SortOrder
    hexColor?: SortOrder
    remarks?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingCategoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    circuitId_type_categoryName_familyCategory?: PricingCategoryCircuitIdTypeCategoryNameFamilyCategoryCompoundUniqueInput
    AND?: PricingCategoryWhereInput | PricingCategoryWhereInput[]
    OR?: PricingCategoryWhereInput[]
    NOT?: PricingCategoryWhereInput | PricingCategoryWhereInput[]
    circuitId?: StringFilter<"PricingCategory"> | string
    type?: StringFilter<"PricingCategory"> | string
    familyCategory?: StringNullableFilter<"PricingCategory"> | string | null
    minAge?: IntNullableFilter<"PricingCategory"> | number | null
    maxAge?: IntNullableFilter<"PricingCategory"> | number | null
    categoryName?: StringFilter<"PricingCategory"> | string
    regRange?: StringFilter<"PricingCategory"> | string
    price?: FloatFilter<"PricingCategory"> | number
    colorCode?: StringFilter<"PricingCategory"> | string
    hexColor?: StringFilter<"PricingCategory"> | string
    remarks?: StringNullableFilter<"PricingCategory"> | string | null
    createdAt?: DateTimeFilter<"PricingCategory"> | Date | string
    updatedAt?: DateTimeFilter<"PricingCategory"> | Date | string
  }, "id" | "circuitId_type_categoryName_familyCategory">

  export type PricingCategoryOrderByWithAggregationInput = {
    id?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    familyCategory?: SortOrderInput | SortOrder
    minAge?: SortOrderInput | SortOrder
    maxAge?: SortOrderInput | SortOrder
    categoryName?: SortOrder
    regRange?: SortOrder
    price?: SortOrder
    colorCode?: SortOrder
    hexColor?: SortOrder
    remarks?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PricingCategoryCountOrderByAggregateInput
    _avg?: PricingCategoryAvgOrderByAggregateInput
    _max?: PricingCategoryMaxOrderByAggregateInput
    _min?: PricingCategoryMinOrderByAggregateInput
    _sum?: PricingCategorySumOrderByAggregateInput
  }

  export type PricingCategoryScalarWhereWithAggregatesInput = {
    AND?: PricingCategoryScalarWhereWithAggregatesInput | PricingCategoryScalarWhereWithAggregatesInput[]
    OR?: PricingCategoryScalarWhereWithAggregatesInput[]
    NOT?: PricingCategoryScalarWhereWithAggregatesInput | PricingCategoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PricingCategory"> | string
    circuitId?: StringWithAggregatesFilter<"PricingCategory"> | string
    type?: StringWithAggregatesFilter<"PricingCategory"> | string
    familyCategory?: StringNullableWithAggregatesFilter<"PricingCategory"> | string | null
    minAge?: IntNullableWithAggregatesFilter<"PricingCategory"> | number | null
    maxAge?: IntNullableWithAggregatesFilter<"PricingCategory"> | number | null
    categoryName?: StringWithAggregatesFilter<"PricingCategory"> | string
    regRange?: StringWithAggregatesFilter<"PricingCategory"> | string
    price?: FloatWithAggregatesFilter<"PricingCategory"> | number
    colorCode?: StringWithAggregatesFilter<"PricingCategory"> | string
    hexColor?: StringWithAggregatesFilter<"PricingCategory"> | string
    remarks?: StringNullableWithAggregatesFilter<"PricingCategory"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PricingCategory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PricingCategory"> | Date | string
  }

  export type EmailLogWhereInput = {
    AND?: EmailLogWhereInput | EmailLogWhereInput[]
    OR?: EmailLogWhereInput[]
    NOT?: EmailLogWhereInput | EmailLogWhereInput[]
    id?: StringFilter<"EmailLog"> | string
    registrationId?: StringFilter<"EmailLog"> | string
    type?: StringFilter<"EmailLog"> | string
    sentAt?: DateTimeFilter<"EmailLog"> | Date | string
    status?: StringFilter<"EmailLog"> | string
    error?: StringNullableFilter<"EmailLog"> | string | null
  }

  export type EmailLogOrderByWithRelationInput = {
    id?: SortOrder
    registrationId?: SortOrder
    type?: SortOrder
    sentAt?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
  }

  export type EmailLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EmailLogWhereInput | EmailLogWhereInput[]
    OR?: EmailLogWhereInput[]
    NOT?: EmailLogWhereInput | EmailLogWhereInput[]
    registrationId?: StringFilter<"EmailLog"> | string
    type?: StringFilter<"EmailLog"> | string
    sentAt?: DateTimeFilter<"EmailLog"> | Date | string
    status?: StringFilter<"EmailLog"> | string
    error?: StringNullableFilter<"EmailLog"> | string | null
  }, "id">

  export type EmailLogOrderByWithAggregationInput = {
    id?: SortOrder
    registrationId?: SortOrder
    type?: SortOrder
    sentAt?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    _count?: EmailLogCountOrderByAggregateInput
    _max?: EmailLogMaxOrderByAggregateInput
    _min?: EmailLogMinOrderByAggregateInput
  }

  export type EmailLogScalarWhereWithAggregatesInput = {
    AND?: EmailLogScalarWhereWithAggregatesInput | EmailLogScalarWhereWithAggregatesInput[]
    OR?: EmailLogScalarWhereWithAggregatesInput[]
    NOT?: EmailLogScalarWhereWithAggregatesInput | EmailLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EmailLog"> | string
    registrationId?: StringWithAggregatesFilter<"EmailLog"> | string
    type?: StringWithAggregatesFilter<"EmailLog"> | string
    sentAt?: DateTimeWithAggregatesFilter<"EmailLog"> | Date | string
    status?: StringWithAggregatesFilter<"EmailLog"> | string
    error?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
  }

  export type RaffleTicketWhereInput = {
    AND?: RaffleTicketWhereInput | RaffleTicketWhereInput[]
    OR?: RaffleTicketWhereInput[]
    NOT?: RaffleTicketWhereInput | RaffleTicketWhereInput[]
    id?: StringFilter<"RaffleTicket"> | string
    firstName?: StringFilter<"RaffleTicket"> | string
    lastName?: StringFilter<"RaffleTicket"> | string
    email?: StringFilter<"RaffleTicket"> | string
    phoneNumber?: StringNullableFilter<"RaffleTicket"> | string | null
    status?: StringFilter<"RaffleTicket"> | string
    createdAt?: DateTimeFilter<"RaffleTicket"> | Date | string
    updatedAt?: DateTimeFilter<"RaffleTicket"> | Date | string
    checkoutRequestId?: StringNullableFilter<"RaffleTicket"> | string | null
    paymentFailed?: BoolFilter<"RaffleTicket"> | boolean
    gender?: StringNullableFilter<"RaffleTicket"> | string | null
    idNumber?: StringNullableFilter<"RaffleTicket"> | string | null
    failureReason?: StringNullableFilter<"RaffleTicket"> | string | null
    mpesaCode?: StringNullableFilter<"RaffleTicket"> | string | null
    paymentDetails?: JsonNullableFilter<"RaffleTicket">
    referralCode?: StringNullableFilter<"RaffleTicket"> | string | null
  }

  export type RaffleTicketOrderByWithRelationInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    checkoutRequestId?: SortOrderInput | SortOrder
    paymentFailed?: SortOrder
    gender?: SortOrderInput | SortOrder
    idNumber?: SortOrderInput | SortOrder
    failureReason?: SortOrderInput | SortOrder
    mpesaCode?: SortOrderInput | SortOrder
    paymentDetails?: SortOrderInput | SortOrder
    referralCode?: SortOrderInput | SortOrder
  }

  export type RaffleTicketWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RaffleTicketWhereInput | RaffleTicketWhereInput[]
    OR?: RaffleTicketWhereInput[]
    NOT?: RaffleTicketWhereInput | RaffleTicketWhereInput[]
    firstName?: StringFilter<"RaffleTicket"> | string
    lastName?: StringFilter<"RaffleTicket"> | string
    email?: StringFilter<"RaffleTicket"> | string
    phoneNumber?: StringNullableFilter<"RaffleTicket"> | string | null
    status?: StringFilter<"RaffleTicket"> | string
    createdAt?: DateTimeFilter<"RaffleTicket"> | Date | string
    updatedAt?: DateTimeFilter<"RaffleTicket"> | Date | string
    checkoutRequestId?: StringNullableFilter<"RaffleTicket"> | string | null
    paymentFailed?: BoolFilter<"RaffleTicket"> | boolean
    gender?: StringNullableFilter<"RaffleTicket"> | string | null
    idNumber?: StringNullableFilter<"RaffleTicket"> | string | null
    failureReason?: StringNullableFilter<"RaffleTicket"> | string | null
    mpesaCode?: StringNullableFilter<"RaffleTicket"> | string | null
    paymentDetails?: JsonNullableFilter<"RaffleTicket">
    referralCode?: StringNullableFilter<"RaffleTicket"> | string | null
  }, "id">

  export type RaffleTicketOrderByWithAggregationInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    checkoutRequestId?: SortOrderInput | SortOrder
    paymentFailed?: SortOrder
    gender?: SortOrderInput | SortOrder
    idNumber?: SortOrderInput | SortOrder
    failureReason?: SortOrderInput | SortOrder
    mpesaCode?: SortOrderInput | SortOrder
    paymentDetails?: SortOrderInput | SortOrder
    referralCode?: SortOrderInput | SortOrder
    _count?: RaffleTicketCountOrderByAggregateInput
    _max?: RaffleTicketMaxOrderByAggregateInput
    _min?: RaffleTicketMinOrderByAggregateInput
  }

  export type RaffleTicketScalarWhereWithAggregatesInput = {
    AND?: RaffleTicketScalarWhereWithAggregatesInput | RaffleTicketScalarWhereWithAggregatesInput[]
    OR?: RaffleTicketScalarWhereWithAggregatesInput[]
    NOT?: RaffleTicketScalarWhereWithAggregatesInput | RaffleTicketScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"RaffleTicket"> | string
    firstName?: StringWithAggregatesFilter<"RaffleTicket"> | string
    lastName?: StringWithAggregatesFilter<"RaffleTicket"> | string
    email?: StringWithAggregatesFilter<"RaffleTicket"> | string
    phoneNumber?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
    status?: StringWithAggregatesFilter<"RaffleTicket"> | string
    createdAt?: DateTimeWithAggregatesFilter<"RaffleTicket"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"RaffleTicket"> | Date | string
    checkoutRequestId?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
    paymentFailed?: BoolWithAggregatesFilter<"RaffleTicket"> | boolean
    gender?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
    idNumber?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
    failureReason?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
    mpesaCode?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
    paymentDetails?: JsonNullableWithAggregatesFilter<"RaffleTicket">
    referralCode?: StringNullableWithAggregatesFilter<"RaffleTicket"> | string | null
  }

  export type ReferralWhereInput = {
    AND?: ReferralWhereInput | ReferralWhereInput[]
    OR?: ReferralWhereInput[]
    NOT?: ReferralWhereInput | ReferralWhereInput[]
    id?: StringFilter<"Referral"> | string
    code?: StringFilter<"Referral"> | string
    influencerName?: StringFilter<"Referral"> | string
    influencerEmail?: StringNullableFilter<"Referral"> | string | null
    influencerPhone?: StringNullableFilter<"Referral"> | string | null
    isActive?: BoolFilter<"Referral"> | boolean
    clicks?: IntFilter<"Referral"> | number
    createdAt?: DateTimeFilter<"Referral"> | Date | string
    updatedAt?: DateTimeFilter<"Referral"> | Date | string
  }

  export type ReferralOrderByWithRelationInput = {
    id?: SortOrder
    code?: SortOrder
    influencerName?: SortOrder
    influencerEmail?: SortOrderInput | SortOrder
    influencerPhone?: SortOrderInput | SortOrder
    isActive?: SortOrder
    clicks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    code?: string
    AND?: ReferralWhereInput | ReferralWhereInput[]
    OR?: ReferralWhereInput[]
    NOT?: ReferralWhereInput | ReferralWhereInput[]
    influencerName?: StringFilter<"Referral"> | string
    influencerEmail?: StringNullableFilter<"Referral"> | string | null
    influencerPhone?: StringNullableFilter<"Referral"> | string | null
    isActive?: BoolFilter<"Referral"> | boolean
    clicks?: IntFilter<"Referral"> | number
    createdAt?: DateTimeFilter<"Referral"> | Date | string
    updatedAt?: DateTimeFilter<"Referral"> | Date | string
  }, "id" | "code">

  export type ReferralOrderByWithAggregationInput = {
    id?: SortOrder
    code?: SortOrder
    influencerName?: SortOrder
    influencerEmail?: SortOrderInput | SortOrder
    influencerPhone?: SortOrderInput | SortOrder
    isActive?: SortOrder
    clicks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReferralCountOrderByAggregateInput
    _avg?: ReferralAvgOrderByAggregateInput
    _max?: ReferralMaxOrderByAggregateInput
    _min?: ReferralMinOrderByAggregateInput
    _sum?: ReferralSumOrderByAggregateInput
  }

  export type ReferralScalarWhereWithAggregatesInput = {
    AND?: ReferralScalarWhereWithAggregatesInput | ReferralScalarWhereWithAggregatesInput[]
    OR?: ReferralScalarWhereWithAggregatesInput[]
    NOT?: ReferralScalarWhereWithAggregatesInput | ReferralScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Referral"> | string
    code?: StringWithAggregatesFilter<"Referral"> | string
    influencerName?: StringWithAggregatesFilter<"Referral"> | string
    influencerEmail?: StringNullableWithAggregatesFilter<"Referral"> | string | null
    influencerPhone?: StringNullableWithAggregatesFilter<"Referral"> | string | null
    isActive?: BoolWithAggregatesFilter<"Referral"> | boolean
    clicks?: IntWithAggregatesFilter<"Referral"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Referral"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Referral"> | Date | string
  }

  export type DonationWhereInput = {
    AND?: DonationWhereInput | DonationWhereInput[]
    OR?: DonationWhereInput[]
    NOT?: DonationWhereInput | DonationWhereInput[]
    id?: StringFilter<"Donation"> | string
    amount?: FloatFilter<"Donation"> | number
    name?: StringNullableFilter<"Donation"> | string | null
    email?: StringNullableFilter<"Donation"> | string | null
    phone?: StringNullableFilter<"Donation"> | string | null
    status?: StringFilter<"Donation"> | string
    checkoutRequestId?: StringNullableFilter<"Donation"> | string | null
    createdAt?: DateTimeFilter<"Donation"> | Date | string
    updatedAt?: DateTimeFilter<"Donation"> | Date | string
    failureReason?: StringNullableFilter<"Donation"> | string | null
    mpesaCode?: StringNullableFilter<"Donation"> | string | null
    paymentDetails?: JsonNullableFilter<"Donation">
  }

  export type DonationOrderByWithRelationInput = {
    id?: SortOrder
    amount?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    status?: SortOrder
    checkoutRequestId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    failureReason?: SortOrderInput | SortOrder
    mpesaCode?: SortOrderInput | SortOrder
    paymentDetails?: SortOrderInput | SortOrder
  }

  export type DonationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    checkoutRequestId?: string
    AND?: DonationWhereInput | DonationWhereInput[]
    OR?: DonationWhereInput[]
    NOT?: DonationWhereInput | DonationWhereInput[]
    amount?: FloatFilter<"Donation"> | number
    name?: StringNullableFilter<"Donation"> | string | null
    email?: StringNullableFilter<"Donation"> | string | null
    phone?: StringNullableFilter<"Donation"> | string | null
    status?: StringFilter<"Donation"> | string
    createdAt?: DateTimeFilter<"Donation"> | Date | string
    updatedAt?: DateTimeFilter<"Donation"> | Date | string
    failureReason?: StringNullableFilter<"Donation"> | string | null
    mpesaCode?: StringNullableFilter<"Donation"> | string | null
    paymentDetails?: JsonNullableFilter<"Donation">
  }, "id" | "checkoutRequestId">

  export type DonationOrderByWithAggregationInput = {
    id?: SortOrder
    amount?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    status?: SortOrder
    checkoutRequestId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    failureReason?: SortOrderInput | SortOrder
    mpesaCode?: SortOrderInput | SortOrder
    paymentDetails?: SortOrderInput | SortOrder
    _count?: DonationCountOrderByAggregateInput
    _avg?: DonationAvgOrderByAggregateInput
    _max?: DonationMaxOrderByAggregateInput
    _min?: DonationMinOrderByAggregateInput
    _sum?: DonationSumOrderByAggregateInput
  }

  export type DonationScalarWhereWithAggregatesInput = {
    AND?: DonationScalarWhereWithAggregatesInput | DonationScalarWhereWithAggregatesInput[]
    OR?: DonationScalarWhereWithAggregatesInput[]
    NOT?: DonationScalarWhereWithAggregatesInput | DonationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Donation"> | string
    amount?: FloatWithAggregatesFilter<"Donation"> | number
    name?: StringNullableWithAggregatesFilter<"Donation"> | string | null
    email?: StringNullableWithAggregatesFilter<"Donation"> | string | null
    phone?: StringNullableWithAggregatesFilter<"Donation"> | string | null
    status?: StringWithAggregatesFilter<"Donation"> | string
    checkoutRequestId?: StringNullableWithAggregatesFilter<"Donation"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Donation"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Donation"> | Date | string
    failureReason?: StringNullableWithAggregatesFilter<"Donation"> | string | null
    mpesaCode?: StringNullableWithAggregatesFilter<"Donation"> | string | null
    paymentDetails?: JsonNullableWithAggregatesFilter<"Donation">
  }

  export type SmsLogWhereInput = {
    AND?: SmsLogWhereInput | SmsLogWhereInput[]
    OR?: SmsLogWhereInput[]
    NOT?: SmsLogWhereInput | SmsLogWhereInput[]
    id?: StringFilter<"SmsLog"> | string
    phoneNumber?: StringFilter<"SmsLog"> | string
    message?: StringFilter<"SmsLog"> | string
    status?: StringFilter<"SmsLog"> | string
    messageId?: StringNullableFilter<"SmsLog"> | string | null
    cost?: StringNullableFilter<"SmsLog"> | string | null
    sentAt?: DateTimeFilter<"SmsLog"> | Date | string
  }

  export type SmsLogOrderByWithRelationInput = {
    id?: SortOrder
    phoneNumber?: SortOrder
    message?: SortOrder
    status?: SortOrder
    messageId?: SortOrderInput | SortOrder
    cost?: SortOrderInput | SortOrder
    sentAt?: SortOrder
  }

  export type SmsLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: SmsLogWhereInput | SmsLogWhereInput[]
    OR?: SmsLogWhereInput[]
    NOT?: SmsLogWhereInput | SmsLogWhereInput[]
    phoneNumber?: StringFilter<"SmsLog"> | string
    message?: StringFilter<"SmsLog"> | string
    status?: StringFilter<"SmsLog"> | string
    messageId?: StringNullableFilter<"SmsLog"> | string | null
    cost?: StringNullableFilter<"SmsLog"> | string | null
    sentAt?: DateTimeFilter<"SmsLog"> | Date | string
  }, "id">

  export type SmsLogOrderByWithAggregationInput = {
    id?: SortOrder
    phoneNumber?: SortOrder
    message?: SortOrder
    status?: SortOrder
    messageId?: SortOrderInput | SortOrder
    cost?: SortOrderInput | SortOrder
    sentAt?: SortOrder
    _count?: SmsLogCountOrderByAggregateInput
    _max?: SmsLogMaxOrderByAggregateInput
    _min?: SmsLogMinOrderByAggregateInput
  }

  export type SmsLogScalarWhereWithAggregatesInput = {
    AND?: SmsLogScalarWhereWithAggregatesInput | SmsLogScalarWhereWithAggregatesInput[]
    OR?: SmsLogScalarWhereWithAggregatesInput[]
    NOT?: SmsLogScalarWhereWithAggregatesInput | SmsLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"SmsLog"> | string
    phoneNumber?: StringWithAggregatesFilter<"SmsLog"> | string
    message?: StringWithAggregatesFilter<"SmsLog"> | string
    status?: StringWithAggregatesFilter<"SmsLog"> | string
    messageId?: StringNullableWithAggregatesFilter<"SmsLog"> | string | null
    cost?: StringNullableWithAggregatesFilter<"SmsLog"> | string | null
    sentAt?: DateTimeWithAggregatesFilter<"SmsLog"> | Date | string
  }

  export type ShortLinkWhereInput = {
    AND?: ShortLinkWhereInput | ShortLinkWhereInput[]
    OR?: ShortLinkWhereInput[]
    NOT?: ShortLinkWhereInput | ShortLinkWhereInput[]
    id?: StringFilter<"ShortLink"> | string
    url?: StringFilter<"ShortLink"> | string
    createdAt?: DateTimeFilter<"ShortLink"> | Date | string
    clicks?: IntFilter<"ShortLink"> | number
  }

  export type ShortLinkOrderByWithRelationInput = {
    id?: SortOrder
    url?: SortOrder
    createdAt?: SortOrder
    clicks?: SortOrder
  }

  export type ShortLinkWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ShortLinkWhereInput | ShortLinkWhereInput[]
    OR?: ShortLinkWhereInput[]
    NOT?: ShortLinkWhereInput | ShortLinkWhereInput[]
    url?: StringFilter<"ShortLink"> | string
    createdAt?: DateTimeFilter<"ShortLink"> | Date | string
    clicks?: IntFilter<"ShortLink"> | number
  }, "id">

  export type ShortLinkOrderByWithAggregationInput = {
    id?: SortOrder
    url?: SortOrder
    createdAt?: SortOrder
    clicks?: SortOrder
    _count?: ShortLinkCountOrderByAggregateInput
    _avg?: ShortLinkAvgOrderByAggregateInput
    _max?: ShortLinkMaxOrderByAggregateInput
    _min?: ShortLinkMinOrderByAggregateInput
    _sum?: ShortLinkSumOrderByAggregateInput
  }

  export type ShortLinkScalarWhereWithAggregatesInput = {
    AND?: ShortLinkScalarWhereWithAggregatesInput | ShortLinkScalarWhereWithAggregatesInput[]
    OR?: ShortLinkScalarWhereWithAggregatesInput[]
    NOT?: ShortLinkScalarWhereWithAggregatesInput | ShortLinkScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ShortLink"> | string
    url?: StringWithAggregatesFilter<"ShortLink"> | string
    createdAt?: DateTimeWithAggregatesFilter<"ShortLink"> | Date | string
    clicks?: IntWithAggregatesFilter<"ShortLink"> | number
  }

  export type BikeHireWhereInput = {
    AND?: BikeHireWhereInput | BikeHireWhereInput[]
    OR?: BikeHireWhereInput[]
    NOT?: BikeHireWhereInput | BikeHireWhereInput[]
    id?: StringFilter<"BikeHire"> | string
    registrationId?: StringFilter<"BikeHire"> | string
    bikeType?: StringFilter<"BikeHire"> | string
    status?: StringFilter<"BikeHire"> | string
    amount?: FloatFilter<"BikeHire"> | number
    createdAt?: DateTimeFilter<"BikeHire"> | Date | string
    updatedAt?: DateTimeFilter<"BikeHire"> | Date | string
    registration?: XOR<RegistrationScalarRelationFilter, RegistrationWhereInput>
  }

  export type BikeHireOrderByWithRelationInput = {
    id?: SortOrder
    registrationId?: SortOrder
    bikeType?: SortOrder
    status?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    registration?: RegistrationOrderByWithRelationInput
  }

  export type BikeHireWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    registrationId?: string
    AND?: BikeHireWhereInput | BikeHireWhereInput[]
    OR?: BikeHireWhereInput[]
    NOT?: BikeHireWhereInput | BikeHireWhereInput[]
    bikeType?: StringFilter<"BikeHire"> | string
    status?: StringFilter<"BikeHire"> | string
    amount?: FloatFilter<"BikeHire"> | number
    createdAt?: DateTimeFilter<"BikeHire"> | Date | string
    updatedAt?: DateTimeFilter<"BikeHire"> | Date | string
    registration?: XOR<RegistrationScalarRelationFilter, RegistrationWhereInput>
  }, "id" | "registrationId">

  export type BikeHireOrderByWithAggregationInput = {
    id?: SortOrder
    registrationId?: SortOrder
    bikeType?: SortOrder
    status?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BikeHireCountOrderByAggregateInput
    _avg?: BikeHireAvgOrderByAggregateInput
    _max?: BikeHireMaxOrderByAggregateInput
    _min?: BikeHireMinOrderByAggregateInput
    _sum?: BikeHireSumOrderByAggregateInput
  }

  export type BikeHireScalarWhereWithAggregatesInput = {
    AND?: BikeHireScalarWhereWithAggregatesInput | BikeHireScalarWhereWithAggregatesInput[]
    OR?: BikeHireScalarWhereWithAggregatesInput[]
    NOT?: BikeHireScalarWhereWithAggregatesInput | BikeHireScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BikeHire"> | string
    registrationId?: StringWithAggregatesFilter<"BikeHire"> | string
    bikeType?: StringWithAggregatesFilter<"BikeHire"> | string
    status?: StringWithAggregatesFilter<"BikeHire"> | string
    amount?: FloatWithAggregatesFilter<"BikeHire"> | number
    createdAt?: DateTimeWithAggregatesFilter<"BikeHire"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"BikeHire"> | Date | string
  }

  export type RegistrationCreateInput = {
    id: string
    createdAt?: Date | string
    updatedAt?: Date | string
    circuitId: string
    type: string
    status?: $Enums.RegistrationStatus
    firstName: string
    lastName: string
    email?: string | null
    phoneNumber?: string | null
    idNumber?: string | null
    dob?: string | null
    gender?: string | null
    groupId?: string | null
    teamName?: string | null
    isCaptain?: boolean
    guardianName?: string | null
    emergencyPhone?: string | null
    relationship?: string | null
    category?: string | null
    totalAmount?: number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: string | null
    tshirtSize?: string | null
    mpesaCode?: string | null
    isMilitary?: boolean
    rank?: string | null
    service?: string | null
    serviceNumber?: string | null
    unit?: string | null
    bikeHire?: BikeHireCreateNestedOneWithoutRegistrationInput
  }

  export type RegistrationUncheckedCreateInput = {
    id: string
    createdAt?: Date | string
    updatedAt?: Date | string
    circuitId: string
    type: string
    status?: $Enums.RegistrationStatus
    firstName: string
    lastName: string
    email?: string | null
    phoneNumber?: string | null
    idNumber?: string | null
    dob?: string | null
    gender?: string | null
    groupId?: string | null
    teamName?: string | null
    isCaptain?: boolean
    guardianName?: string | null
    emergencyPhone?: string | null
    relationship?: string | null
    category?: string | null
    totalAmount?: number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: string | null
    tshirtSize?: string | null
    mpesaCode?: string | null
    isMilitary?: boolean
    rank?: string | null
    service?: string | null
    serviceNumber?: string | null
    unit?: string | null
    bikeHire?: BikeHireUncheckedCreateNestedOneWithoutRegistrationInput
  }

  export type RegistrationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: EnumRegistrationStatusFieldUpdateOperationsInput | $Enums.RegistrationStatus
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    isCaptain?: BoolFieldUpdateOperationsInput | boolean
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyPhone?: NullableStringFieldUpdateOperationsInput | string | null
    relationship?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: FloatFieldUpdateOperationsInput | number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: NullableStringFieldUpdateOperationsInput | string | null
    tshirtSize?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    isMilitary?: BoolFieldUpdateOperationsInput | boolean
    rank?: NullableStringFieldUpdateOperationsInput | string | null
    service?: NullableStringFieldUpdateOperationsInput | string | null
    serviceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
    bikeHire?: BikeHireUpdateOneWithoutRegistrationNestedInput
  }

  export type RegistrationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: EnumRegistrationStatusFieldUpdateOperationsInput | $Enums.RegistrationStatus
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    isCaptain?: BoolFieldUpdateOperationsInput | boolean
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyPhone?: NullableStringFieldUpdateOperationsInput | string | null
    relationship?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: FloatFieldUpdateOperationsInput | number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: NullableStringFieldUpdateOperationsInput | string | null
    tshirtSize?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    isMilitary?: BoolFieldUpdateOperationsInput | boolean
    rank?: NullableStringFieldUpdateOperationsInput | string | null
    service?: NullableStringFieldUpdateOperationsInput | string | null
    serviceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
    bikeHire?: BikeHireUncheckedUpdateOneWithoutRegistrationNestedInput
  }

  export type RegistrationCreateManyInput = {
    id: string
    createdAt?: Date | string
    updatedAt?: Date | string
    circuitId: string
    type: string
    status?: $Enums.RegistrationStatus
    firstName: string
    lastName: string
    email?: string | null
    phoneNumber?: string | null
    idNumber?: string | null
    dob?: string | null
    gender?: string | null
    groupId?: string | null
    teamName?: string | null
    isCaptain?: boolean
    guardianName?: string | null
    emergencyPhone?: string | null
    relationship?: string | null
    category?: string | null
    totalAmount?: number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: string | null
    tshirtSize?: string | null
    mpesaCode?: string | null
    isMilitary?: boolean
    rank?: string | null
    service?: string | null
    serviceNumber?: string | null
    unit?: string | null
  }

  export type RegistrationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: EnumRegistrationStatusFieldUpdateOperationsInput | $Enums.RegistrationStatus
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    isCaptain?: BoolFieldUpdateOperationsInput | boolean
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyPhone?: NullableStringFieldUpdateOperationsInput | string | null
    relationship?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: FloatFieldUpdateOperationsInput | number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: NullableStringFieldUpdateOperationsInput | string | null
    tshirtSize?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    isMilitary?: BoolFieldUpdateOperationsInput | boolean
    rank?: NullableStringFieldUpdateOperationsInput | string | null
    service?: NullableStringFieldUpdateOperationsInput | string | null
    serviceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RegistrationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: EnumRegistrationStatusFieldUpdateOperationsInput | $Enums.RegistrationStatus
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    isCaptain?: BoolFieldUpdateOperationsInput | boolean
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyPhone?: NullableStringFieldUpdateOperationsInput | string | null
    relationship?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: FloatFieldUpdateOperationsInput | number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: NullableStringFieldUpdateOperationsInput | string | null
    tshirtSize?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    isMilitary?: BoolFieldUpdateOperationsInput | boolean
    rank?: NullableStringFieldUpdateOperationsInput | string | null
    service?: NullableStringFieldUpdateOperationsInput | string | null
    serviceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AdminCreateInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    lastLogin?: Date | string | null
    sessions?: AdminSessionCreateNestedManyWithoutAdminInput
  }

  export type AdminUncheckedCreateInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    lastLogin?: Date | string | null
    sessions?: AdminSessionUncheckedCreateNestedManyWithoutAdminInput
  }

  export type AdminUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sessions?: AdminSessionUpdateManyWithoutAdminNestedInput
  }

  export type AdminUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sessions?: AdminSessionUncheckedUpdateManyWithoutAdminNestedInput
  }

  export type AdminCreateManyInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    lastLogin?: Date | string | null
  }

  export type AdminUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AdminUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AdminSessionCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
    admin: AdminCreateNestedOneWithoutSessionsInput
  }

  export type AdminSessionUncheckedCreateInput = {
    id?: string
    adminId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    admin?: AdminUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type AdminSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionCreateManyInput = {
    id?: string
    adminId: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    adminId?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentCreateInput = {
    id?: string
    registrationId?: string | null
    raffleTicketIds?: PaymentCreateraffleTicketIdsInput | string[]
    donationId?: string | null
    checkoutRequestId?: string | null
    merchantRequestId?: string | null
    phone?: string | null
    amount: number
    status?: string
    failureReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    mpesaReceiptNumber?: string | null
    transactionDate?: string | null
    mnoReference?: string | null
    cbsReference?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PaymentUncheckedCreateInput = {
    id?: string
    registrationId?: string | null
    raffleTicketIds?: PaymentCreateraffleTicketIdsInput | string[]
    donationId?: string | null
    checkoutRequestId?: string | null
    merchantRequestId?: string | null
    phone?: string | null
    amount: number
    status?: string
    failureReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    mpesaReceiptNumber?: string | null
    transactionDate?: string | null
    mnoReference?: string | null
    cbsReference?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PaymentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: NullableStringFieldUpdateOperationsInput | string | null
    raffleTicketIds?: PaymentUpdateraffleTicketIdsInput | string[]
    donationId?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    merchantRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mpesaReceiptNumber?: NullableStringFieldUpdateOperationsInput | string | null
    transactionDate?: NullableStringFieldUpdateOperationsInput | string | null
    mnoReference?: NullableStringFieldUpdateOperationsInput | string | null
    cbsReference?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PaymentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: NullableStringFieldUpdateOperationsInput | string | null
    raffleTicketIds?: PaymentUpdateraffleTicketIdsInput | string[]
    donationId?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    merchantRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mpesaReceiptNumber?: NullableStringFieldUpdateOperationsInput | string | null
    transactionDate?: NullableStringFieldUpdateOperationsInput | string | null
    mnoReference?: NullableStringFieldUpdateOperationsInput | string | null
    cbsReference?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PaymentCreateManyInput = {
    id?: string
    registrationId?: string | null
    raffleTicketIds?: PaymentCreateraffleTicketIdsInput | string[]
    donationId?: string | null
    checkoutRequestId?: string | null
    merchantRequestId?: string | null
    phone?: string | null
    amount: number
    status?: string
    failureReason?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    mpesaReceiptNumber?: string | null
    transactionDate?: string | null
    mnoReference?: string | null
    cbsReference?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PaymentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: NullableStringFieldUpdateOperationsInput | string | null
    raffleTicketIds?: PaymentUpdateraffleTicketIdsInput | string[]
    donationId?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    merchantRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mpesaReceiptNumber?: NullableStringFieldUpdateOperationsInput | string | null
    transactionDate?: NullableStringFieldUpdateOperationsInput | string | null
    mnoReference?: NullableStringFieldUpdateOperationsInput | string | null
    cbsReference?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PaymentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: NullableStringFieldUpdateOperationsInput | string | null
    raffleTicketIds?: PaymentUpdateraffleTicketIdsInput | string[]
    donationId?: NullableStringFieldUpdateOperationsInput | string | null
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    merchantRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    amount?: FloatFieldUpdateOperationsInput | number
    status?: StringFieldUpdateOperationsInput | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    mpesaReceiptNumber?: NullableStringFieldUpdateOperationsInput | string | null
    transactionDate?: NullableStringFieldUpdateOperationsInput | string | null
    mnoReference?: NullableStringFieldUpdateOperationsInput | string | null
    cbsReference?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type PricingCategoryCreateInput = {
    id?: string
    circuitId: string
    type: string
    familyCategory?: string | null
    minAge?: number | null
    maxAge?: number | null
    categoryName: string
    regRange: string
    price: number
    colorCode: string
    hexColor: string
    remarks?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingCategoryUncheckedCreateInput = {
    id?: string
    circuitId: string
    type: string
    familyCategory?: string | null
    minAge?: number | null
    maxAge?: number | null
    categoryName: string
    regRange: string
    price: number
    colorCode: string
    hexColor: string
    remarks?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingCategoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    familyCategory?: NullableStringFieldUpdateOperationsInput | string | null
    minAge?: NullableIntFieldUpdateOperationsInput | number | null
    maxAge?: NullableIntFieldUpdateOperationsInput | number | null
    categoryName?: StringFieldUpdateOperationsInput | string
    regRange?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    colorCode?: StringFieldUpdateOperationsInput | string
    hexColor?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingCategoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    familyCategory?: NullableStringFieldUpdateOperationsInput | string | null
    minAge?: NullableIntFieldUpdateOperationsInput | number | null
    maxAge?: NullableIntFieldUpdateOperationsInput | number | null
    categoryName?: StringFieldUpdateOperationsInput | string
    regRange?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    colorCode?: StringFieldUpdateOperationsInput | string
    hexColor?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingCategoryCreateManyInput = {
    id?: string
    circuitId: string
    type: string
    familyCategory?: string | null
    minAge?: number | null
    maxAge?: number | null
    categoryName: string
    regRange: string
    price: number
    colorCode: string
    hexColor: string
    remarks?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PricingCategoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    familyCategory?: NullableStringFieldUpdateOperationsInput | string | null
    minAge?: NullableIntFieldUpdateOperationsInput | number | null
    maxAge?: NullableIntFieldUpdateOperationsInput | number | null
    categoryName?: StringFieldUpdateOperationsInput | string
    regRange?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    colorCode?: StringFieldUpdateOperationsInput | string
    hexColor?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PricingCategoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    familyCategory?: NullableStringFieldUpdateOperationsInput | string | null
    minAge?: NullableIntFieldUpdateOperationsInput | number | null
    maxAge?: NullableIntFieldUpdateOperationsInput | number | null
    categoryName?: StringFieldUpdateOperationsInput | string
    regRange?: StringFieldUpdateOperationsInput | string
    price?: FloatFieldUpdateOperationsInput | number
    colorCode?: StringFieldUpdateOperationsInput | string
    hexColor?: StringFieldUpdateOperationsInput | string
    remarks?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailLogCreateInput = {
    id?: string
    registrationId: string
    type: string
    sentAt?: Date | string
    status: string
    error?: string | null
  }

  export type EmailLogUncheckedCreateInput = {
    id?: string
    registrationId: string
    type: string
    sentAt?: Date | string
    status: string
    error?: string | null
  }

  export type EmailLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailLogCreateManyInput = {
    id?: string
    registrationId: string
    type: string
    sentAt?: Date | string
    status: string
    error?: string | null
  }

  export type EmailLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RaffleTicketCreateInput = {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    checkoutRequestId?: string | null
    paymentFailed?: boolean
    gender?: string | null
    idNumber?: string | null
    failureReason?: string | null
    mpesaCode?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: string | null
  }

  export type RaffleTicketUncheckedCreateInput = {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    checkoutRequestId?: string | null
    paymentFailed?: boolean
    gender?: string | null
    idNumber?: string | null
    failureReason?: string | null
    mpesaCode?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: string | null
  }

  export type RaffleTicketUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentFailed?: BoolFieldUpdateOperationsInput | boolean
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RaffleTicketUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentFailed?: BoolFieldUpdateOperationsInput | boolean
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RaffleTicketCreateManyInput = {
    id: string
    firstName: string
    lastName: string
    email: string
    phoneNumber?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    checkoutRequestId?: string | null
    paymentFailed?: boolean
    gender?: string | null
    idNumber?: string | null
    failureReason?: string | null
    mpesaCode?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: string | null
  }

  export type RaffleTicketUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentFailed?: BoolFieldUpdateOperationsInput | boolean
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RaffleTicketUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    paymentFailed?: BoolFieldUpdateOperationsInput | boolean
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
    referralCode?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type ReferralCreateInput = {
    id?: string
    code: string
    influencerName: string
    influencerEmail?: string | null
    influencerPhone?: string | null
    isActive?: boolean
    clicks?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUncheckedCreateInput = {
    id?: string
    code: string
    influencerName: string
    influencerEmail?: string | null
    influencerPhone?: string | null
    isActive?: boolean
    clicks?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    influencerName?: StringFieldUpdateOperationsInput | string
    influencerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    influencerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    clicks?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    influencerName?: StringFieldUpdateOperationsInput | string
    influencerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    influencerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    clicks?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralCreateManyInput = {
    id?: string
    code: string
    influencerName: string
    influencerEmail?: string | null
    influencerPhone?: string | null
    isActive?: boolean
    clicks?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    influencerName?: StringFieldUpdateOperationsInput | string
    influencerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    influencerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    clicks?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    code?: StringFieldUpdateOperationsInput | string
    influencerName?: StringFieldUpdateOperationsInput | string
    influencerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    influencerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    isActive?: BoolFieldUpdateOperationsInput | boolean
    clicks?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DonationCreateInput = {
    id?: string
    amount: number
    name?: string | null
    email?: string | null
    phone?: string | null
    status?: string
    checkoutRequestId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    failureReason?: string | null
    mpesaCode?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type DonationUncheckedCreateInput = {
    id?: string
    amount: number
    name?: string | null
    email?: string | null
    phone?: string | null
    status?: string
    checkoutRequestId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    failureReason?: string | null
    mpesaCode?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type DonationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type DonationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type DonationCreateManyInput = {
    id?: string
    amount: number
    name?: string | null
    email?: string | null
    phone?: string | null
    status?: string
    checkoutRequestId?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    failureReason?: string | null
    mpesaCode?: string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type DonationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type DonationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    checkoutRequestId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    failureReason?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    paymentDetails?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SmsLogCreateInput = {
    id?: string
    phoneNumber: string
    message: string
    status: string
    messageId?: string | null
    cost?: string | null
    sentAt?: Date | string
  }

  export type SmsLogUncheckedCreateInput = {
    id?: string
    phoneNumber: string
    message: string
    status: string
    messageId?: string | null
    cost?: string | null
    sentAt?: Date | string
  }

  export type SmsLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SmsLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SmsLogCreateManyInput = {
    id?: string
    phoneNumber: string
    message: string
    status: string
    messageId?: string | null
    cost?: string | null
    sentAt?: Date | string
  }

  export type SmsLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SmsLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    phoneNumber?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    messageId?: NullableStringFieldUpdateOperationsInput | string | null
    cost?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ShortLinkCreateInput = {
    id: string
    url: string
    createdAt?: Date | string
    clicks?: number
  }

  export type ShortLinkUncheckedCreateInput = {
    id: string
    url: string
    createdAt?: Date | string
    clicks?: number
  }

  export type ShortLinkUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    clicks?: IntFieldUpdateOperationsInput | number
  }

  export type ShortLinkUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    clicks?: IntFieldUpdateOperationsInput | number
  }

  export type ShortLinkCreateManyInput = {
    id: string
    url: string
    createdAt?: Date | string
    clicks?: number
  }

  export type ShortLinkUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    clicks?: IntFieldUpdateOperationsInput | number
  }

  export type ShortLinkUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    url?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    clicks?: IntFieldUpdateOperationsInput | number
  }

  export type BikeHireCreateInput = {
    id?: string
    bikeType?: string
    status?: string
    amount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    registration: RegistrationCreateNestedOneWithoutBikeHireInput
  }

  export type BikeHireUncheckedCreateInput = {
    id?: string
    registrationId: string
    bikeType?: string
    status?: string
    amount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BikeHireUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    bikeType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    registration?: RegistrationUpdateOneRequiredWithoutBikeHireNestedInput
  }

  export type BikeHireUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: StringFieldUpdateOperationsInput | string
    bikeType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BikeHireCreateManyInput = {
    id?: string
    registrationId: string
    bikeType?: string
    status?: string
    amount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BikeHireUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bikeType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BikeHireUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    registrationId?: StringFieldUpdateOperationsInput | string
    bikeType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EnumRegistrationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RegistrationStatus | EnumRegistrationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRegistrationStatusFilter<$PrismaModel> | $Enums.RegistrationStatus
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BikeHireNullableScalarRelationFilter = {
    is?: BikeHireWhereInput | null
    isNot?: BikeHireWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type RegistrationCountOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrder
    idNumber?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    groupId?: SortOrder
    teamName?: SortOrder
    isCaptain?: SortOrder
    guardianName?: SortOrder
    emergencyPhone?: SortOrder
    relationship?: SortOrder
    category?: SortOrder
    totalAmount?: SortOrder
    payload?: SortOrder
    pricing?: SortOrder
    classifications?: SortOrder
    emergencyContactName?: SortOrder
    tshirtSize?: SortOrder
    mpesaCode?: SortOrder
    isMilitary?: SortOrder
    rank?: SortOrder
    service?: SortOrder
    serviceNumber?: SortOrder
    unit?: SortOrder
  }

  export type RegistrationAvgOrderByAggregateInput = {
    totalAmount?: SortOrder
  }

  export type RegistrationMaxOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrder
    idNumber?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    groupId?: SortOrder
    teamName?: SortOrder
    isCaptain?: SortOrder
    guardianName?: SortOrder
    emergencyPhone?: SortOrder
    relationship?: SortOrder
    category?: SortOrder
    totalAmount?: SortOrder
    emergencyContactName?: SortOrder
    tshirtSize?: SortOrder
    mpesaCode?: SortOrder
    isMilitary?: SortOrder
    rank?: SortOrder
    service?: SortOrder
    serviceNumber?: SortOrder
    unit?: SortOrder
  }

  export type RegistrationMinOrderByAggregateInput = {
    id?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    status?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrder
    idNumber?: SortOrder
    dob?: SortOrder
    gender?: SortOrder
    groupId?: SortOrder
    teamName?: SortOrder
    isCaptain?: SortOrder
    guardianName?: SortOrder
    emergencyPhone?: SortOrder
    relationship?: SortOrder
    category?: SortOrder
    totalAmount?: SortOrder
    emergencyContactName?: SortOrder
    tshirtSize?: SortOrder
    mpesaCode?: SortOrder
    isMilitary?: SortOrder
    rank?: SortOrder
    service?: SortOrder
    serviceNumber?: SortOrder
    unit?: SortOrder
  }

  export type RegistrationSumOrderByAggregateInput = {
    totalAmount?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRegistrationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RegistrationStatus | EnumRegistrationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRegistrationStatusWithAggregatesFilter<$PrismaModel> | $Enums.RegistrationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRegistrationStatusFilter<$PrismaModel>
    _max?: NestedEnumRegistrationStatusFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type AdminSessionListRelationFilter = {
    every?: AdminSessionWhereInput
    some?: AdminSessionWhereInput
    none?: AdminSessionWhereInput
  }

  export type AdminSessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AdminCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
  }

  export type AdminMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
  }

  export type AdminMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    lastLogin?: SortOrder
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type AdminScalarRelationFilter = {
    is?: AdminWhereInput
    isNot?: AdminWhereInput
  }

  export type AdminSessionCountOrderByAggregateInput = {
    id?: SortOrder
    adminId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    adminId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminSessionMinOrderByAggregateInput = {
    id?: SortOrder
    adminId?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type StringNullableListFilter<$PrismaModel = never> = {
    equals?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    has?: string | StringFieldRefInput<$PrismaModel> | null
    hasEvery?: string[] | ListStringFieldRefInput<$PrismaModel>
    hasSome?: string[] | ListStringFieldRefInput<$PrismaModel>
    isEmpty?: boolean
  }

  export type PaymentCountOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    raffleTicketIds?: SortOrder
    donationId?: SortOrder
    checkoutRequestId?: SortOrder
    merchantRequestId?: SortOrder
    phone?: SortOrder
    amount?: SortOrder
    status?: SortOrder
    failureReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    mpesaReceiptNumber?: SortOrder
    transactionDate?: SortOrder
    mnoReference?: SortOrder
    cbsReference?: SortOrder
    paymentDetails?: SortOrder
  }

  export type PaymentAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type PaymentMaxOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    donationId?: SortOrder
    checkoutRequestId?: SortOrder
    merchantRequestId?: SortOrder
    phone?: SortOrder
    amount?: SortOrder
    status?: SortOrder
    failureReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    mpesaReceiptNumber?: SortOrder
    transactionDate?: SortOrder
    mnoReference?: SortOrder
    cbsReference?: SortOrder
  }

  export type PaymentMinOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    donationId?: SortOrder
    checkoutRequestId?: SortOrder
    merchantRequestId?: SortOrder
    phone?: SortOrder
    amount?: SortOrder
    status?: SortOrder
    failureReason?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    mpesaReceiptNumber?: SortOrder
    transactionDate?: SortOrder
    mnoReference?: SortOrder
    cbsReference?: SortOrder
  }

  export type PaymentSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type PricingCategoryCircuitIdTypeCategoryNameFamilyCategoryCompoundUniqueInput = {
    circuitId: string
    type: string
    categoryName: string
    familyCategory: string
  }

  export type PricingCategoryCountOrderByAggregateInput = {
    id?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    familyCategory?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    categoryName?: SortOrder
    regRange?: SortOrder
    price?: SortOrder
    colorCode?: SortOrder
    hexColor?: SortOrder
    remarks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingCategoryAvgOrderByAggregateInput = {
    minAge?: SortOrder
    maxAge?: SortOrder
    price?: SortOrder
  }

  export type PricingCategoryMaxOrderByAggregateInput = {
    id?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    familyCategory?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    categoryName?: SortOrder
    regRange?: SortOrder
    price?: SortOrder
    colorCode?: SortOrder
    hexColor?: SortOrder
    remarks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingCategoryMinOrderByAggregateInput = {
    id?: SortOrder
    circuitId?: SortOrder
    type?: SortOrder
    familyCategory?: SortOrder
    minAge?: SortOrder
    maxAge?: SortOrder
    categoryName?: SortOrder
    regRange?: SortOrder
    price?: SortOrder
    colorCode?: SortOrder
    hexColor?: SortOrder
    remarks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PricingCategorySumOrderByAggregateInput = {
    minAge?: SortOrder
    maxAge?: SortOrder
    price?: SortOrder
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EmailLogCountOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    type?: SortOrder
    sentAt?: SortOrder
    status?: SortOrder
    error?: SortOrder
  }

  export type EmailLogMaxOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    type?: SortOrder
    sentAt?: SortOrder
    status?: SortOrder
    error?: SortOrder
  }

  export type EmailLogMinOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    type?: SortOrder
    sentAt?: SortOrder
    status?: SortOrder
    error?: SortOrder
  }

  export type RaffleTicketCountOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    checkoutRequestId?: SortOrder
    paymentFailed?: SortOrder
    gender?: SortOrder
    idNumber?: SortOrder
    failureReason?: SortOrder
    mpesaCode?: SortOrder
    paymentDetails?: SortOrder
    referralCode?: SortOrder
  }

  export type RaffleTicketMaxOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    checkoutRequestId?: SortOrder
    paymentFailed?: SortOrder
    gender?: SortOrder
    idNumber?: SortOrder
    failureReason?: SortOrder
    mpesaCode?: SortOrder
    referralCode?: SortOrder
  }

  export type RaffleTicketMinOrderByAggregateInput = {
    id?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    email?: SortOrder
    phoneNumber?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    checkoutRequestId?: SortOrder
    paymentFailed?: SortOrder
    gender?: SortOrder
    idNumber?: SortOrder
    failureReason?: SortOrder
    mpesaCode?: SortOrder
    referralCode?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type ReferralCountOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    influencerName?: SortOrder
    influencerEmail?: SortOrder
    influencerPhone?: SortOrder
    isActive?: SortOrder
    clicks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralAvgOrderByAggregateInput = {
    clicks?: SortOrder
  }

  export type ReferralMaxOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    influencerName?: SortOrder
    influencerEmail?: SortOrder
    influencerPhone?: SortOrder
    isActive?: SortOrder
    clicks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralMinOrderByAggregateInput = {
    id?: SortOrder
    code?: SortOrder
    influencerName?: SortOrder
    influencerEmail?: SortOrder
    influencerPhone?: SortOrder
    isActive?: SortOrder
    clicks?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralSumOrderByAggregateInput = {
    clicks?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DonationCountOrderByAggregateInput = {
    id?: SortOrder
    amount?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    status?: SortOrder
    checkoutRequestId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    failureReason?: SortOrder
    mpesaCode?: SortOrder
    paymentDetails?: SortOrder
  }

  export type DonationAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type DonationMaxOrderByAggregateInput = {
    id?: SortOrder
    amount?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    status?: SortOrder
    checkoutRequestId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    failureReason?: SortOrder
    mpesaCode?: SortOrder
  }

  export type DonationMinOrderByAggregateInput = {
    id?: SortOrder
    amount?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    status?: SortOrder
    checkoutRequestId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    failureReason?: SortOrder
    mpesaCode?: SortOrder
  }

  export type DonationSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type SmsLogCountOrderByAggregateInput = {
    id?: SortOrder
    phoneNumber?: SortOrder
    message?: SortOrder
    status?: SortOrder
    messageId?: SortOrder
    cost?: SortOrder
    sentAt?: SortOrder
  }

  export type SmsLogMaxOrderByAggregateInput = {
    id?: SortOrder
    phoneNumber?: SortOrder
    message?: SortOrder
    status?: SortOrder
    messageId?: SortOrder
    cost?: SortOrder
    sentAt?: SortOrder
  }

  export type SmsLogMinOrderByAggregateInput = {
    id?: SortOrder
    phoneNumber?: SortOrder
    message?: SortOrder
    status?: SortOrder
    messageId?: SortOrder
    cost?: SortOrder
    sentAt?: SortOrder
  }

  export type ShortLinkCountOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    createdAt?: SortOrder
    clicks?: SortOrder
  }

  export type ShortLinkAvgOrderByAggregateInput = {
    clicks?: SortOrder
  }

  export type ShortLinkMaxOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    createdAt?: SortOrder
    clicks?: SortOrder
  }

  export type ShortLinkMinOrderByAggregateInput = {
    id?: SortOrder
    url?: SortOrder
    createdAt?: SortOrder
    clicks?: SortOrder
  }

  export type ShortLinkSumOrderByAggregateInput = {
    clicks?: SortOrder
  }

  export type RegistrationScalarRelationFilter = {
    is?: RegistrationWhereInput
    isNot?: RegistrationWhereInput
  }

  export type BikeHireCountOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    bikeType?: SortOrder
    status?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BikeHireAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type BikeHireMaxOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    bikeType?: SortOrder
    status?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BikeHireMinOrderByAggregateInput = {
    id?: SortOrder
    registrationId?: SortOrder
    bikeType?: SortOrder
    status?: SortOrder
    amount?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BikeHireSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type BikeHireCreateNestedOneWithoutRegistrationInput = {
    create?: XOR<BikeHireCreateWithoutRegistrationInput, BikeHireUncheckedCreateWithoutRegistrationInput>
    connectOrCreate?: BikeHireCreateOrConnectWithoutRegistrationInput
    connect?: BikeHireWhereUniqueInput
  }

  export type BikeHireUncheckedCreateNestedOneWithoutRegistrationInput = {
    create?: XOR<BikeHireCreateWithoutRegistrationInput, BikeHireUncheckedCreateWithoutRegistrationInput>
    connectOrCreate?: BikeHireCreateOrConnectWithoutRegistrationInput
    connect?: BikeHireWhereUniqueInput
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumRegistrationStatusFieldUpdateOperationsInput = {
    set?: $Enums.RegistrationStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BikeHireUpdateOneWithoutRegistrationNestedInput = {
    create?: XOR<BikeHireCreateWithoutRegistrationInput, BikeHireUncheckedCreateWithoutRegistrationInput>
    connectOrCreate?: BikeHireCreateOrConnectWithoutRegistrationInput
    upsert?: BikeHireUpsertWithoutRegistrationInput
    disconnect?: BikeHireWhereInput | boolean
    delete?: BikeHireWhereInput | boolean
    connect?: BikeHireWhereUniqueInput
    update?: XOR<XOR<BikeHireUpdateToOneWithWhereWithoutRegistrationInput, BikeHireUpdateWithoutRegistrationInput>, BikeHireUncheckedUpdateWithoutRegistrationInput>
  }

  export type BikeHireUncheckedUpdateOneWithoutRegistrationNestedInput = {
    create?: XOR<BikeHireCreateWithoutRegistrationInput, BikeHireUncheckedCreateWithoutRegistrationInput>
    connectOrCreate?: BikeHireCreateOrConnectWithoutRegistrationInput
    upsert?: BikeHireUpsertWithoutRegistrationInput
    disconnect?: BikeHireWhereInput | boolean
    delete?: BikeHireWhereInput | boolean
    connect?: BikeHireWhereUniqueInput
    update?: XOR<XOR<BikeHireUpdateToOneWithWhereWithoutRegistrationInput, BikeHireUpdateWithoutRegistrationInput>, BikeHireUncheckedUpdateWithoutRegistrationInput>
  }

  export type AdminSessionCreateNestedManyWithoutAdminInput = {
    create?: XOR<AdminSessionCreateWithoutAdminInput, AdminSessionUncheckedCreateWithoutAdminInput> | AdminSessionCreateWithoutAdminInput[] | AdminSessionUncheckedCreateWithoutAdminInput[]
    connectOrCreate?: AdminSessionCreateOrConnectWithoutAdminInput | AdminSessionCreateOrConnectWithoutAdminInput[]
    createMany?: AdminSessionCreateManyAdminInputEnvelope
    connect?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
  }

  export type AdminSessionUncheckedCreateNestedManyWithoutAdminInput = {
    create?: XOR<AdminSessionCreateWithoutAdminInput, AdminSessionUncheckedCreateWithoutAdminInput> | AdminSessionCreateWithoutAdminInput[] | AdminSessionUncheckedCreateWithoutAdminInput[]
    connectOrCreate?: AdminSessionCreateOrConnectWithoutAdminInput | AdminSessionCreateOrConnectWithoutAdminInput[]
    createMany?: AdminSessionCreateManyAdminInputEnvelope
    connect?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type AdminSessionUpdateManyWithoutAdminNestedInput = {
    create?: XOR<AdminSessionCreateWithoutAdminInput, AdminSessionUncheckedCreateWithoutAdminInput> | AdminSessionCreateWithoutAdminInput[] | AdminSessionUncheckedCreateWithoutAdminInput[]
    connectOrCreate?: AdminSessionCreateOrConnectWithoutAdminInput | AdminSessionCreateOrConnectWithoutAdminInput[]
    upsert?: AdminSessionUpsertWithWhereUniqueWithoutAdminInput | AdminSessionUpsertWithWhereUniqueWithoutAdminInput[]
    createMany?: AdminSessionCreateManyAdminInputEnvelope
    set?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    disconnect?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    delete?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    connect?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    update?: AdminSessionUpdateWithWhereUniqueWithoutAdminInput | AdminSessionUpdateWithWhereUniqueWithoutAdminInput[]
    updateMany?: AdminSessionUpdateManyWithWhereWithoutAdminInput | AdminSessionUpdateManyWithWhereWithoutAdminInput[]
    deleteMany?: AdminSessionScalarWhereInput | AdminSessionScalarWhereInput[]
  }

  export type AdminSessionUncheckedUpdateManyWithoutAdminNestedInput = {
    create?: XOR<AdminSessionCreateWithoutAdminInput, AdminSessionUncheckedCreateWithoutAdminInput> | AdminSessionCreateWithoutAdminInput[] | AdminSessionUncheckedCreateWithoutAdminInput[]
    connectOrCreate?: AdminSessionCreateOrConnectWithoutAdminInput | AdminSessionCreateOrConnectWithoutAdminInput[]
    upsert?: AdminSessionUpsertWithWhereUniqueWithoutAdminInput | AdminSessionUpsertWithWhereUniqueWithoutAdminInput[]
    createMany?: AdminSessionCreateManyAdminInputEnvelope
    set?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    disconnect?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    delete?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    connect?: AdminSessionWhereUniqueInput | AdminSessionWhereUniqueInput[]
    update?: AdminSessionUpdateWithWhereUniqueWithoutAdminInput | AdminSessionUpdateWithWhereUniqueWithoutAdminInput[]
    updateMany?: AdminSessionUpdateManyWithWhereWithoutAdminInput | AdminSessionUpdateManyWithWhereWithoutAdminInput[]
    deleteMany?: AdminSessionScalarWhereInput | AdminSessionScalarWhereInput[]
  }

  export type AdminCreateNestedOneWithoutSessionsInput = {
    create?: XOR<AdminCreateWithoutSessionsInput, AdminUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: AdminCreateOrConnectWithoutSessionsInput
    connect?: AdminWhereUniqueInput
  }

  export type AdminUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<AdminCreateWithoutSessionsInput, AdminUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: AdminCreateOrConnectWithoutSessionsInput
    upsert?: AdminUpsertWithoutSessionsInput
    connect?: AdminWhereUniqueInput
    update?: XOR<XOR<AdminUpdateToOneWithWhereWithoutSessionsInput, AdminUpdateWithoutSessionsInput>, AdminUncheckedUpdateWithoutSessionsInput>
  }

  export type PaymentCreateraffleTicketIdsInput = {
    set: string[]
  }

  export type PaymentUpdateraffleTicketIdsInput = {
    set?: string[]
    push?: string | string[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type RegistrationCreateNestedOneWithoutBikeHireInput = {
    create?: XOR<RegistrationCreateWithoutBikeHireInput, RegistrationUncheckedCreateWithoutBikeHireInput>
    connectOrCreate?: RegistrationCreateOrConnectWithoutBikeHireInput
    connect?: RegistrationWhereUniqueInput
  }

  export type RegistrationUpdateOneRequiredWithoutBikeHireNestedInput = {
    create?: XOR<RegistrationCreateWithoutBikeHireInput, RegistrationUncheckedCreateWithoutBikeHireInput>
    connectOrCreate?: RegistrationCreateOrConnectWithoutBikeHireInput
    upsert?: RegistrationUpsertWithoutBikeHireInput
    connect?: RegistrationWhereUniqueInput
    update?: XOR<XOR<RegistrationUpdateToOneWithWhereWithoutBikeHireInput, RegistrationUpdateWithoutBikeHireInput>, RegistrationUncheckedUpdateWithoutBikeHireInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedEnumRegistrationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RegistrationStatus | EnumRegistrationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRegistrationStatusFilter<$PrismaModel> | $Enums.RegistrationStatus
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRegistrationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RegistrationStatus | EnumRegistrationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RegistrationStatus[] | ListEnumRegistrationStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRegistrationStatusWithAggregatesFilter<$PrismaModel> | $Enums.RegistrationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRegistrationStatusFilter<$PrismaModel>
    _max?: NestedEnumRegistrationStatusFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BikeHireCreateWithoutRegistrationInput = {
    id?: string
    bikeType?: string
    status?: string
    amount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BikeHireUncheckedCreateWithoutRegistrationInput = {
    id?: string
    bikeType?: string
    status?: string
    amount?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BikeHireCreateOrConnectWithoutRegistrationInput = {
    where: BikeHireWhereUniqueInput
    create: XOR<BikeHireCreateWithoutRegistrationInput, BikeHireUncheckedCreateWithoutRegistrationInput>
  }

  export type BikeHireUpsertWithoutRegistrationInput = {
    update: XOR<BikeHireUpdateWithoutRegistrationInput, BikeHireUncheckedUpdateWithoutRegistrationInput>
    create: XOR<BikeHireCreateWithoutRegistrationInput, BikeHireUncheckedCreateWithoutRegistrationInput>
    where?: BikeHireWhereInput
  }

  export type BikeHireUpdateToOneWithWhereWithoutRegistrationInput = {
    where?: BikeHireWhereInput
    data: XOR<BikeHireUpdateWithoutRegistrationInput, BikeHireUncheckedUpdateWithoutRegistrationInput>
  }

  export type BikeHireUpdateWithoutRegistrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bikeType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BikeHireUncheckedUpdateWithoutRegistrationInput = {
    id?: StringFieldUpdateOperationsInput | string
    bikeType?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    amount?: FloatFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionCreateWithoutAdminInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUncheckedCreateWithoutAdminInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionCreateOrConnectWithoutAdminInput = {
    where: AdminSessionWhereUniqueInput
    create: XOR<AdminSessionCreateWithoutAdminInput, AdminSessionUncheckedCreateWithoutAdminInput>
  }

  export type AdminSessionCreateManyAdminInputEnvelope = {
    data: AdminSessionCreateManyAdminInput | AdminSessionCreateManyAdminInput[]
    skipDuplicates?: boolean
  }

  export type AdminSessionUpsertWithWhereUniqueWithoutAdminInput = {
    where: AdminSessionWhereUniqueInput
    update: XOR<AdminSessionUpdateWithoutAdminInput, AdminSessionUncheckedUpdateWithoutAdminInput>
    create: XOR<AdminSessionCreateWithoutAdminInput, AdminSessionUncheckedCreateWithoutAdminInput>
  }

  export type AdminSessionUpdateWithWhereUniqueWithoutAdminInput = {
    where: AdminSessionWhereUniqueInput
    data: XOR<AdminSessionUpdateWithoutAdminInput, AdminSessionUncheckedUpdateWithoutAdminInput>
  }

  export type AdminSessionUpdateManyWithWhereWithoutAdminInput = {
    where: AdminSessionScalarWhereInput
    data: XOR<AdminSessionUpdateManyMutationInput, AdminSessionUncheckedUpdateManyWithoutAdminInput>
  }

  export type AdminSessionScalarWhereInput = {
    AND?: AdminSessionScalarWhereInput | AdminSessionScalarWhereInput[]
    OR?: AdminSessionScalarWhereInput[]
    NOT?: AdminSessionScalarWhereInput | AdminSessionScalarWhereInput[]
    id?: StringFilter<"AdminSession"> | string
    adminId?: StringFilter<"AdminSession"> | string
    token?: StringFilter<"AdminSession"> | string
    expiresAt?: DateTimeFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeFilter<"AdminSession"> | Date | string
  }

  export type AdminCreateWithoutSessionsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    lastLogin?: Date | string | null
  }

  export type AdminUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    lastLogin?: Date | string | null
  }

  export type AdminCreateOrConnectWithoutSessionsInput = {
    where: AdminWhereUniqueInput
    create: XOR<AdminCreateWithoutSessionsInput, AdminUncheckedCreateWithoutSessionsInput>
  }

  export type AdminUpsertWithoutSessionsInput = {
    update: XOR<AdminUpdateWithoutSessionsInput, AdminUncheckedUpdateWithoutSessionsInput>
    create: XOR<AdminCreateWithoutSessionsInput, AdminUncheckedCreateWithoutSessionsInput>
    where?: AdminWhereInput
  }

  export type AdminUpdateToOneWithWhereWithoutSessionsInput = {
    where?: AdminWhereInput
    data: XOR<AdminUpdateWithoutSessionsInput, AdminUncheckedUpdateWithoutSessionsInput>
  }

  export type AdminUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AdminUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastLogin?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type RegistrationCreateWithoutBikeHireInput = {
    id: string
    createdAt?: Date | string
    updatedAt?: Date | string
    circuitId: string
    type: string
    status?: $Enums.RegistrationStatus
    firstName: string
    lastName: string
    email?: string | null
    phoneNumber?: string | null
    idNumber?: string | null
    dob?: string | null
    gender?: string | null
    groupId?: string | null
    teamName?: string | null
    isCaptain?: boolean
    guardianName?: string | null
    emergencyPhone?: string | null
    relationship?: string | null
    category?: string | null
    totalAmount?: number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: string | null
    tshirtSize?: string | null
    mpesaCode?: string | null
    isMilitary?: boolean
    rank?: string | null
    service?: string | null
    serviceNumber?: string | null
    unit?: string | null
  }

  export type RegistrationUncheckedCreateWithoutBikeHireInput = {
    id: string
    createdAt?: Date | string
    updatedAt?: Date | string
    circuitId: string
    type: string
    status?: $Enums.RegistrationStatus
    firstName: string
    lastName: string
    email?: string | null
    phoneNumber?: string | null
    idNumber?: string | null
    dob?: string | null
    gender?: string | null
    groupId?: string | null
    teamName?: string | null
    isCaptain?: boolean
    guardianName?: string | null
    emergencyPhone?: string | null
    relationship?: string | null
    category?: string | null
    totalAmount?: number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: string | null
    tshirtSize?: string | null
    mpesaCode?: string | null
    isMilitary?: boolean
    rank?: string | null
    service?: string | null
    serviceNumber?: string | null
    unit?: string | null
  }

  export type RegistrationCreateOrConnectWithoutBikeHireInput = {
    where: RegistrationWhereUniqueInput
    create: XOR<RegistrationCreateWithoutBikeHireInput, RegistrationUncheckedCreateWithoutBikeHireInput>
  }

  export type RegistrationUpsertWithoutBikeHireInput = {
    update: XOR<RegistrationUpdateWithoutBikeHireInput, RegistrationUncheckedUpdateWithoutBikeHireInput>
    create: XOR<RegistrationCreateWithoutBikeHireInput, RegistrationUncheckedCreateWithoutBikeHireInput>
    where?: RegistrationWhereInput
  }

  export type RegistrationUpdateToOneWithWhereWithoutBikeHireInput = {
    where?: RegistrationWhereInput
    data: XOR<RegistrationUpdateWithoutBikeHireInput, RegistrationUncheckedUpdateWithoutBikeHireInput>
  }

  export type RegistrationUpdateWithoutBikeHireInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: EnumRegistrationStatusFieldUpdateOperationsInput | $Enums.RegistrationStatus
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    isCaptain?: BoolFieldUpdateOperationsInput | boolean
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyPhone?: NullableStringFieldUpdateOperationsInput | string | null
    relationship?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: FloatFieldUpdateOperationsInput | number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: NullableStringFieldUpdateOperationsInput | string | null
    tshirtSize?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    isMilitary?: BoolFieldUpdateOperationsInput | boolean
    rank?: NullableStringFieldUpdateOperationsInput | string | null
    service?: NullableStringFieldUpdateOperationsInput | string | null
    serviceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type RegistrationUncheckedUpdateWithoutBikeHireInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    circuitId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    status?: EnumRegistrationStatusFieldUpdateOperationsInput | $Enums.RegistrationStatus
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phoneNumber?: NullableStringFieldUpdateOperationsInput | string | null
    idNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dob?: NullableStringFieldUpdateOperationsInput | string | null
    gender?: NullableStringFieldUpdateOperationsInput | string | null
    groupId?: NullableStringFieldUpdateOperationsInput | string | null
    teamName?: NullableStringFieldUpdateOperationsInput | string | null
    isCaptain?: BoolFieldUpdateOperationsInput | boolean
    guardianName?: NullableStringFieldUpdateOperationsInput | string | null
    emergencyPhone?: NullableStringFieldUpdateOperationsInput | string | null
    relationship?: NullableStringFieldUpdateOperationsInput | string | null
    category?: NullableStringFieldUpdateOperationsInput | string | null
    totalAmount?: FloatFieldUpdateOperationsInput | number
    payload?: NullableJsonNullValueInput | InputJsonValue
    pricing?: NullableJsonNullValueInput | InputJsonValue
    classifications?: NullableJsonNullValueInput | InputJsonValue
    emergencyContactName?: NullableStringFieldUpdateOperationsInput | string | null
    tshirtSize?: NullableStringFieldUpdateOperationsInput | string | null
    mpesaCode?: NullableStringFieldUpdateOperationsInput | string | null
    isMilitary?: BoolFieldUpdateOperationsInput | boolean
    rank?: NullableStringFieldUpdateOperationsInput | string | null
    service?: NullableStringFieldUpdateOperationsInput | string | null
    serviceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    unit?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type AdminSessionCreateManyAdminInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUpdateWithoutAdminInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionUncheckedUpdateWithoutAdminInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionUncheckedUpdateManyWithoutAdminInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}