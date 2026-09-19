export type TRegisterUser = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  accountType?: "JOB_SEEKER" | "JOB_POSTER" | "BOTH";
};

export type TLoginUser = {
  email: string;
  password: string;
};

export type TSafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  skillTags: string[];
  role: string;
  accountType: string;
  authProvider: string;
  status: string;
  isVerified: boolean;
  isPhoneVerified: boolean;
  warnings: number;
};

export type TAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TLoginResult = TAuthTokens & { user: TSafeUser };

export type TSocialLoginResult = TLoginResult & { isNewUser: boolean };