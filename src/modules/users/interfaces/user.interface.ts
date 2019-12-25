export interface User {
    id?: number;
    firstName?: string;
    surname?: string;
    email: string;
    password: string;
}

export interface UpdateUser {
    firstName?: string;
    surname?: string;
    email?: string;
}
