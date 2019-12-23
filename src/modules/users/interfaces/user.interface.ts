export interface User {
    id?: number;
    firstName?: string;
    surname?: string;
    email: string;
    password: string;
}

export interface UpdateUser {
    id: number;
    firstName?: string;
    surname?: string;
    email?: string;
}
