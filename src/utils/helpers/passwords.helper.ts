import * as bcrypt from 'bcryptjs';

export class PasswordsHelper {
    public static async hash(password: string): Promise<string> {
        const numOfRounds: number = 10;

        return new Promise((resolve, reject) => {
            bcrypt.genSalt(numOfRounds, (err, salt) => {
                if (err) reject(err);

                bcrypt.hash(password, salt, (err, hash) => {
                    if (err) reject(err);

                    resolve(hash);
                });
            });
        });
    }

    public static async compare(password: string, hash: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, hash, (err, res) => {
                if (err) reject(err);

                resolve(res);
            });
        });
    }
}
