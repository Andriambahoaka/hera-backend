export type SignupDto = {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  userType: number;
  ownerId?: string | null;
};