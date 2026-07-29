import { PrismaClient } from "./generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";


const adapter = new PrismaPg({
    connectionString:process.env.DATABASE_URL
})

const prismaClientSingleton = ()=>{
    return new PrismaClient({adapter})
}

declare const globalThis: {
    prismaGloabal:ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGloabal || prismaClientSingleton();

if(process.env.NODE_ENV !== "production") globalThis.prismaGloabal = prisma;

export default prisma;