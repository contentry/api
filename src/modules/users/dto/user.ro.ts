import { Field, ObjectType, ID } from 'type-graphql';
import { RoleRO } from '@modules/roles/dto';

@ObjectType()
export class UserRO {
    @Field(type => ID)
    readonly id: number;

    @Field(type => String)
    readonly firstName: string;

    @Field(type => String)
    readonly surname: string;

    @Field(type => String)
    readonly email: string;

    @Field(type => [RoleRO], { nullable: true })
    readonly roles?: RoleRO[];
}
