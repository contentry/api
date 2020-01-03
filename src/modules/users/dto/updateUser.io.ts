import { IsEmail, Length, IsOptional } from 'class-validator';
import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdateUserIO {
    @Field(type => String, { nullable: true })
    @Length(1, 100)
    @IsOptional()
    readonly firstName?: string;

    @Field(type => String, { nullable: true })
    @Length(1, 100)
    @IsOptional()
    readonly surname?: string;

    @Field(type => String, { nullable: true })
    @IsEmail()
    @IsOptional()
    readonly email?: string;

    constructor(data: {
        firstName?: string,
        surname?: string,
        email?: string
    }) {
        Object.assign(this, data);
    }
}
