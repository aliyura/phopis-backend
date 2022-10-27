export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  BUSINESS = 'BUSINESS',
}
export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  BLOCKED = 'BLOCKED',
  RELEASED = 'RELEASED',
  FAILED = 'FAILED',
  SUCCESSFUL = 'SUCCESSFUL',
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum ActionType {
  OWNERSHIPCHANGE = 'OWNERSHIPCHANGE',
  ADJUSTMENT = 'ADJUSTMENT',
  UPLOAD = 'UPLOAD',
  UPDATE = 'UPDATE',
}
export enum WalletActivity {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}
export enum BusinessTarget {
  MANY = 'MANY',
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export enum AccountType {
  BUSINESS = 'BUSINESS',
  INDIVIDUAL = 'INDIVIDUAL',
}
