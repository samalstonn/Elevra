// __mocks__/prisma.ts
const prisma = {
    user: {
      // Mock a user lookup by ID or email
      findUnique: jest.fn().mockResolvedValue({
        id: "1",
        email: "test@example.com",
        name: "Test User",
      }),
      // Add more methods (create, update, etc.) as needed
    },
  };
  
  export default prisma;