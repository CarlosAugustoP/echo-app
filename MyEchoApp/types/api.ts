export type Uuid = string;
export type IsoDateTimeString = string;
export type DecimalStringOrNumber = number;

// Backend enums are currently serialized as integers.
export type UserRoleCode = number;
export type DonationStatusCode = number;
export type VendorStatusCode = number;

export type ApiResult<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
  errorCode: string | null;
  timestamp: IsoDateTimeString;
};

export type ApiErrorResult = ApiResult<string | null>;

export type PaginatedList<T> = {
  items: T[];
  totalCount: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
};

export type TaxIdDto = {
  value: string;
  isCpf: boolean;
  isCnpj: boolean;
};

export type ImageUrlDto = {
  url: string;
};

export type UserDto = {
  id: Uuid;
  name: string;
  email: string;
  walletAddress: string;
  taxId: TaxIdDto;
  role: UserRoleCode;
  profilePicture: ImageUrlDto | null;
  address?: AddressRequestDto | null;
  description?: string | null;
  bio?: string | null;
};

export type EchoAmountResponseDto = {
  echoAmount: number;
};

export type UpdateWalletAddressRequestDto = {
  walletAddress: string;
};

export type UpdateUserRequestDto = {
  name?: string | null;
  email?: string | null;
  address?: AddressRequestDto | null;
  profilePictureBase64?: string | null;
};

export type AddressRequestDto = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  number: number | null;
  countryCode: string;
  neighborhood: string;
};

export type BaseSignupRequestDto = {
  name: string;
  email: string;
  password: string;
  walletAddress: string;
  taxId: string;
  address: AddressRequestDto;
  role: number;
};

export type NgoSignupRequestDto = BaseSignupRequestDto;
export type DonorSignupRequestDto = BaseSignupRequestDto;

export type SignupRequestDto = NgoSignupRequestDto | DonorSignupRequestDto;

export type GoalTypeDto = {
  id: Uuid;
  name: string;
  description: string;
};

export type GoalDto = {
  id: Uuid;
  title: string;
  description: string;
  targetAmount: DecimalStringOrNumber;
  currentAmount: DecimalStringOrNumber;
  goalType: GoalTypeDto;
  progress: DecimalStringOrNumber;
  costPerUnit: number | null;
};

export type CreateProjectGoalRequestDto = {
  title: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  costPerUnit: number | null;
  vendorIds: Uuid[] | null;
  goalTypeId: Uuid;
};

export type CreateProjectRequestDto = {
  title: string;
  description: string;
  goals: CreateProjectGoalRequestDto[];
};

export type ProjectDto = {
  id: Uuid;
  title: string;
  description: string;
  managerId: Uuid;
  goals: GoalDto[];
  smartContractAddress: string;
  mainImage: string | null;
  images: string[];
  progress: DecimalStringOrNumber;
  createdByName: string;
  createdById : Uuid;
};

export type ProjectHeaderDto = {
  id: Uuid;
  title: string;
  description: string;
  createdAt: IsoDateTimeString;
  mainImage: string;
  progress: DecimalStringOrNumber;
};

export type ProjectBlogPostDto = {
  id: Uuid;
  headerImage: string | null;
  title: string;
  content: string;
  projectId: Uuid;
  imagesUrls: string[];
  createdAt: IsoDateTimeString;
};

export type ProjectBlogPostHeaderDto = {
  id: Uuid;
  headerImage: string | null;
  title: string;
  createdAt: IsoDateTimeString;
  first100CharsOfContent: string;
};

export type DonationDto = {
  id: Uuid;
  amount: DecimalStringOrNumber;
  totalCost: DecimalStringOrNumber;
  transactionHash: string;
  fundsReleaseHash?: string | null;
  status: DonationStatusCode;
  statusDesc: string;
  nameItem: string;
  donorId: Uuid;
  goalId: Uuid;
  goalName: string;
  projectName: string;
  projectId: Uuid;
  createdAt: IsoDateTimeString;
  transferredToVendorId?: Uuid | null;
};

export type DonationRequestDto = {
  amount: number;
  totalAmountETH: number;
  goalId: Uuid;
  transactionHash: string;
};

export type DonationEventDto = {
  status: DonationStatusCode;
  timestamp: IsoDateTimeString;
  message: string;
  statusString: string;
};

export type VendorDto = {
  id: Uuid;
  typeItemSupply: string;
  name: string;
  document: TaxIdDto;
  status: VendorStatusCode;
};

export type ContributionSummaryDto = {
  totalContributed: DecimalStringOrNumber;
  variationInCurrentMonth: DecimalStringOrNumber;
  variationInCurrentMonthPercentage: string;
};

export type AmountAndGoalTypeDto = {
  goalType: string;
  amount: number;
};

export type ImpactByRegionDto = {
  amount: DecimalStringOrNumber;
  region: string;
};

export type ContributionTotalDto = {
  amount: DecimalStringOrNumber;
  totalCost: DecimalStringOrNumber;
};

export type DonationDistributionDto = Record<string, DecimalStringOrNumber>;

export type QueryParamValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryParamValue>;

export type JsonObject = Record<string, unknown>;
