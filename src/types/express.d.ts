// Augments Express's Request type with the authenticated identity attached
// by auth.middleware.ts, so req.user is strictly typed everywhere else.
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
      requestId?: string;
    }
  }
}

export {};
