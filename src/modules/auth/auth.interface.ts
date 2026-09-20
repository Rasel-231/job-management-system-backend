export type TRegisterUser = {
  name: string;
  email: string;
  password: string;
};

export type TLoginUser = {
  email: string;
  password: string;
};

export type TSafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl: string | null;
};

export type TAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TLoginResult = TAuthTokens & { user: TSafeUser };

export type TRefreshResult = TAuthTokens & { role: string };
