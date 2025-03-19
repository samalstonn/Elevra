"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var prismaClientSingleton = function () {
    return new client_1.PrismaClient({
        datasources: {
            db: {
                url: process.env.NODE_ENV === 'production'
                    ? process.env.DATABASE_URL_PROD
                    : process.env.DATABASE_URL_DEV,
            },
        },
    });
};
var prisma = globalThis.prisma || prismaClientSingleton();
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma = prisma;
exports.default = prisma;
