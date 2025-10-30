type User = {
    id: string;
    email: string;
    name?: string;
    passwordHash?: string | null;
    createdAt: string;
};
type Vault = {
    id: string;
    name: string;
    ownerId: string;
    createdAt: string;
};
type Entry = {
    id: string;
    vaultId: string;
    data: any;
    createdAt: string;
};
type DBShape = {
    users: User[];
    vaults: Vault[];
    entries: Entry[];
};
declare function list<T extends keyof DBShape>(collection: T): Promise<DBShape[T]>;
declare function getById<T extends keyof DBShape>(collection: T, id: string): Promise<any>;
declare function create<T extends keyof DBShape>(collection: T, item: any): Promise<any>;
declare function update<T extends keyof DBShape>(collection: T, id: string, patch: any): Promise<any>;
declare function remove<T extends keyof DBShape>(collection: T, id: string): Promise<boolean>;
declare function listUsers(): Promise<User[]>;
declare function getUserById(id: string): Promise<any>;
declare function findUserByEmail(email: string): Promise<User | null>;
declare function createUser(payload: Partial<User>): Promise<User>;
declare function updateUser(id: string, patch: Partial<User>): Promise<any>;
declare function deleteUser(id: string): Promise<boolean>;
declare const _default: {
    list: typeof list;
    getById: typeof getById;
    create: typeof create;
    update: typeof update;
    remove: typeof remove;
    listUsers: typeof listUsers;
    getUserById: typeof getUserById;
    findUserByEmail: typeof findUserByEmail;
    createUser: typeof createUser;
    updateUser: typeof updateUser;
    deleteUser: typeof deleteUser;
};
export default _default;
//# sourceMappingURL=db.d.ts.map