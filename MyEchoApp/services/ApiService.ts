import type {
  AmountAndGoalTypeDto,
  ApiResult,
  ContributionSummaryDto,
  ContributionTotalDto,
  CreateProjectGoalRequestDto,
  CreateProjectRequestDto,
  DonationRequestDto,
  DonationDistributionDto,
  DonationDto,
  DonationEventDto,
  GoalDto,
  GoalTypeDto,
  ImpactByRegionDto,
  JsonObject,
  PaginatedList,
  ProjectBlogPostDto,
  ProjectBlogPostHeaderDto,
  ProjectDto,
  ProjectHeaderDto,
  QueryParams,
  UpdateWalletAddressRequestDto,
  UpdateUserRequestDto,
  UserDto,
  Uuid,
  VendorDto,
  EchoAmountResponseDto,
} from "../types/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type PrimitiveBody = JsonObject | unknown[] | string | number | boolean | null;
type RequestBody = PrimitiveBody | FormData | undefined;

type RequestOptions<TBody extends RequestBody = RequestBody> = {
  method?: HttpMethod;
  path: string;
  query?: QueryParams;
  body?: TBody;
  headers?: Record<string, string>;
  auth?: boolean;
};

export type ApiServiceOptions = {
  baseUrl?: string;
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  defaultHeaders?: Record<string, string>;
};

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5087";

export class ApiServiceError extends Error {
  status: number;
  errorCode: string | null;
  timestamp: string | null;

  constructor(message: string, status: number, errorCode: string | null, timestamp: string | null) {
    super(message);
    this.name = "ApiServiceError";
    this.status = status;
    this.errorCode = errorCode;
    this.timestamp = timestamp;
  }
}

export class ApiService {
  private readonly baseUrl: string;
  private readonly getAccessToken?: ApiServiceOptions["getAccessToken"];
  private readonly defaultHeaders: Record<string, string>;

  constructor({ baseUrl, getAccessToken, defaultHeaders }: ApiServiceOptions) {
    this.baseUrl = (baseUrl ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    this.getAccessToken = getAccessToken;
    this.defaultHeaders = defaultHeaders ?? {};
  }

  async signup<TBody extends JsonObject>(body: TBody) {
    return this.request<UserDto, TBody>({ method: "POST", path: "/api/auth/signup", body });
  }

  async login<TBody extends JsonObject>(body: TBody) {
    return this.request<string, TBody>({ method: "POST", path: "/api/auth/login", body });
  }

  async me() {
    return this.request<UserDto>({ path: "/api/auth/me", auth: true });
  }

  async getEchoAmount() {
    return this.request<EchoAmountResponseDto>({
      path: "/api/user-profile/echo-amount",
      auth: true,
    });
  }

  async updateProfile(body: UpdateUserRequestDto) {
    return this.request<UserDto, UpdateUserRequestDto>({
      method: "PATCH",
      path: "/api/user-profile",
      body,
      auth: true,
    });
  }

  async updateWalletAddress(body: UpdateWalletAddressRequestDto) {
    return this.request<UserDto, UpdateWalletAddressRequestDto>({
      method: "PATCH",
      path: "/api/user-profile/wallet-address",
      body,
      auth: true,
    });
  }

  async getUserById(id: Uuid) {
    return this.request<UserDto>({ path: `/api/user-profile/${id}` });
  }

  async getProjectsByManager(managerId: Uuid, query?: QueryParams) {
    return this.request<PaginatedList<ProjectDto>>({
      path: `/api/projects/manager/${managerId}`,
      query,
      auth: true,
    });
  }

  async getProjectById(id: Uuid) {
    return this.request<ProjectDto>({ path: `/api/projects/${id}` });
  }

  async createProject(body: CreateProjectRequestDto) {
    return this.request<ProjectDto, CreateProjectRequestDto>({
      method: "POST",
      path: "/api/projects",
      body,
      auth: true,
    });
  }

  async updateProject<TBody extends JsonObject>(id: Uuid, body: TBody) {
    return this.request<ProjectDto, TBody>({
      method: "PUT",
      path: `/api/projects/${id}`,
      body,
      auth: true,
    });
  }

  async addGoal(projectId: Uuid, body: CreateProjectGoalRequestDto) {
    return this.request<GoalDto, CreateProjectGoalRequestDto>({
      method: "POST",
      path: `/api/projects/${projectId}/goals`,
      body,
      auth: true,
    });
  }

  async removeGoal(projectId: Uuid, goalId: Uuid) {
    await this.requestNoContent({
      method: "DELETE",
      path: `/api/projects/${projectId}/goals/${goalId}`,
      auth: true,
    });
  }

  async getTrendingProjects(query?: QueryParams) {
    return this.request<PaginatedList<ProjectHeaderDto>>({
      path: "/api/projects/trending",
      query,
    });
  }

  async getForYouProjects(query?: QueryParams) {
    return this.request<PaginatedList<ProjectHeaderDto>>({
      path: "/api/projects/for-you",
      query,
      auth: true,
    });
  }

  async addBlogPost<TBody extends JsonObject>(projectId: Uuid, body: TBody) {
    return this.request<ProjectBlogPostDto, TBody>({
      method: "POST",
      path: `/api/projects/blog-post/project/${projectId}`,
      body,
      auth: true,
    });
  }

  async getBlogPost(blogPostId: Uuid) {
    return this.request<ProjectBlogPostDto>({ path: `/api/projects/blog-post/${blogPostId}` });
  }

  async getBlogPosts(projectId: Uuid, query?: QueryParams) {
    return this.request<PaginatedList<ProjectBlogPostHeaderDto>>({
      path: `/api/projects/blog-post/project/${projectId}`,
      query,
    });
  }

  async addImageToBlogPost<TBody extends RequestBody>(projectId: Uuid, blogPostId: Uuid, body?: TBody) {
    await this.requestNoContent<TBody>({
      method: "POST",
      path: `/api/projects/blog-post/${projectId}/${blogPostId}/add-image`,
      body,
      auth: true,
    });
  }

  async getRecommendedBlogPosts(query?: QueryParams) {
    return this.request<PaginatedList<ProjectBlogPostHeaderDto>>({
      path: "/api/projects/blog-post/for-you",
      query,
      auth: true,
    });
  }

  async getProjectDonations(projectId: Uuid, query?: QueryParams) {
    return this.request<PaginatedList<DonationDto>>({
      path: `/api/donations/project/${projectId}`,
      query,
      auth: true,
    });
  }

  async donate(body: DonationRequestDto) {
    return this.request<boolean, DonationRequestDto>({
      method: "POST",
      path: "/api/donations/donate",
      body,
      auth: true,
    });
  }

  async getDonationHistory(query?: QueryParams) {
    return this.request<PaginatedList<DonationDto>>({
      path: "/api/donations/history",
      query,
      auth: true,
    });
  }

  async getDonationById(id: Uuid) {
    return this.request<DonationDto>({
      path: `/api/donations/view-donation/${id}`,
      auth: true,
    });
  }

  async transferToVendor(donationId: Uuid, vendorId: Uuid) {
    return this.request<boolean>({
      method: "POST",
      path: `/api/donations/transfer-to-vendor/${donationId}/${vendorId}`,
      auth: true,
    });
  }

  async getDonationTimeline(donationId: Uuid) {
    return this.request<DonationEventDto[]>({
      path: `/api/donations/timeline/${donationId}`,
      auth: true,
    });
  }

  async getDonationDistribution() {
    return this.request<DonationDistributionDto>({ path: "/api/donations/donation-distribution" });
  }

  async approveVendor(vendorId: Uuid) {
    return this.request<boolean>({
      method: "POST",
      path: `/api/vendors/approve/${vendorId}`,
      auth: true,
    });
  }

  async denyVendor(vendorId: Uuid) {
    return this.request<boolean>({
      method: "POST",
      path: `/api/vendors/deny/${vendorId}`,
      auth: true,
    });
  }

  async createVendor<TBody extends JsonObject>(body: TBody) {
    return this.request<VendorDto, TBody>({
      method: "POST",
      path: "/api/vendors",
      body,
      auth: true,
    });
  }

  async getVendor(vendorId: Uuid) {
    return this.request<VendorDto>({ path: `/api/vendors/${vendorId}` });
  }

  async getVendors(query?: QueryParams) {
    return this.requestPlain<PaginatedList<VendorDto>>({
      path: "/api/vendors",
      query,
      auth: true,
    });
  }

  async assignVendorToGoal(vendorId: Uuid, goalId: Uuid) {
    return this.request<boolean>({
      method: "POST",
      path: `/api/vendors/vendor/${vendorId}/goal/${goalId}`,
      auth: true,
    });
  }

  async createGoalType<TBody extends JsonObject>(body: TBody) {
    return this.request<GoalTypeDto, TBody>({
      method: "POST",
      path: "/api/goals/types",
      body,
      auth: true,
    });
  }

  async getGoalTypes(query?: QueryParams) {
    return this.request<PaginatedList<GoalTypeDto>>({
      path: "/api/goals/types",
      query,
      auth: true,
    });
  }

  async getContributionSummary() {
    return this.request<ContributionSummaryDto>({
      path: "/api/dashboard/contribution-summary",
      auth: true,
    });
  }

  async getAmountByGoalType() {
    return this.request<AmountAndGoalTypeDto[]>({
      path: "/api/dashboard/amount-by-goal-type",
      auth: true,
    });
  }

  async getImpactByRegion() {
    return this.request<ImpactByRegionDto[]>({
      path: "/api/dashboard/impact-by-region",
      auth: true,
    });
  }

  async getDonationEvents() {
    return this.request<DonationEventDto[]>({
      path: "/api/dashboard/donation-events",
      auth: true,
    });
  }

  async getContributionTotal() {
    return this.request<ContributionTotalDto>({
      path: "/api/dashboard/count-by-user",
      auth: true,
    });
  }

  async getWalletBalance(walletAddress: string) {
    return this.request<number>({ path: `/api/wallet/balance/${encodeURIComponent(walletAddress)}` });
  }

  async requestEnvelope<TResponse, TBody extends RequestBody = RequestBody>(
    options: RequestOptions<TBody>,
  ): Promise<ApiResult<TResponse>> {
    const response = await this.fetchRaw(options);
    const rawPayload = await this.parseJsonSafely(response);
    const payload = rawPayload as ApiResult<TResponse>;

    if (!response.ok) {
      throw new ApiServiceError(
        this.extractErrorMessage(rawPayload, response.status),
        response.status,
        this.extractErrorCode(rawPayload),
        this.extractTimestamp(rawPayload),
      );
    }

    if (!payload.success) {
      throw new ApiServiceError(
        payload.error ?? `Request failed with status ${response.status}`,
        response.status,
        payload.errorCode,
        payload.timestamp ?? null,
      );
    }

    return payload;
  }

  async request<TResponse, TBody extends RequestBody = RequestBody>(
    options: RequestOptions<TBody>,
  ): Promise<TResponse> {
    const envelope = await this.requestEnvelope<TResponse, TBody>(options);

    if (envelope.data === null) {
      throw new ApiServiceError(
        "The API returned a successful response without data.",
        200,
        envelope.errorCode,
        envelope.timestamp,
      );
    }

    return envelope.data;
  }

  async requestPlain<TResponse, TBody extends RequestBody = RequestBody>(
    options: RequestOptions<TBody>,
  ): Promise<TResponse> {
    const response = await this.fetchRaw(options);
    const payload = await this.parseJsonSafely(response);

    if (!response.ok) {
      throw new ApiServiceError(
        this.extractErrorMessage(payload, response.status),
        response.status,
        this.extractErrorCode(payload),
        this.extractTimestamp(payload),
      );
    }

    if (payload === null) {
      throw new ApiServiceError("The API returned a successful response without data.", 200, null, null);
    }

    return payload as TResponse;
  }

  async requestNoContent<TBody extends RequestBody = RequestBody>(
    options: RequestOptions<TBody>,
  ): Promise<void> {
    const response = await this.fetchRaw(options);

    if (!response.ok) {
      const payload = await this.parseJsonSafely(response);
      throw new ApiServiceError(
        this.extractErrorMessage(payload, response.status),
        response.status,
        this.extractErrorCode(payload),
        this.extractTimestamp(payload),
      );
    }
  }

  private async fetchRaw<TBody extends RequestBody>({
    method = "GET",
    path,
    query,
    body,
    headers,
    auth = false,
  }: RequestOptions<TBody>) {
    const url = this.buildUrl(path, query);
    const requestHeaders: Record<string, string> = {
      ...this.defaultHeaders,
      ...headers,
    };

    if (!(body instanceof FormData) && body !== undefined) {
      requestHeaders["Content-Type"] = requestHeaders["Content-Type"] ?? "application/json";
    }

    if (auth) {
      const token = await this.getAccessToken?.();

      if (!token) {
        throw new ApiServiceError("Authentication is required, but no access token is available.", 401, null, null);
      }

      requestHeaders.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      method,
      headers: requestHeaders,
      body: this.serializeBody(body),
    });
  }

  private buildUrl(path: string, query?: QueryParams) {
    const url = new URL(`${this.baseUrl}${path}`);

    if (!query) {
      return url.toString();
    }

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    return url.toString();
  }

  private serializeBody(body: RequestBody): BodyInit | undefined {
    if (body === undefined) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    return JSON.stringify(body);
  }

  private async parseJsonSafely(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private extractErrorMessage(payload: unknown, status: number): string {
    if (!payload || typeof payload !== "object") {
      return `Request failed with status ${status}`;
    }

    const apiPayload = payload as Partial<ApiResult<unknown>>;
    if (typeof apiPayload.error === "string" && apiPayload.error.length > 0) {
      return apiPayload.error;
    }

    const problemPayload = payload as {
      title?: unknown;
      errors?: Record<string, string[]>;
    };

    if (problemPayload.errors && typeof problemPayload.errors === "object") {
      const validationErrors = Object.entries(problemPayload.errors)
        .flatMap(([field, messages]) =>
          Array.isArray(messages) ? messages.map((message) => `${field}: ${message}`) : [],
        )
        .join("\n");

      if (validationErrors.length > 0) {
        return validationErrors;
      }
    }

    if (typeof problemPayload.title === "string" && problemPayload.title.length > 0) {
      return problemPayload.title;
    }

    return `Request failed with status ${status}`;
  }

  private extractErrorCode(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const apiPayload = payload as Partial<ApiResult<unknown>>;
    return typeof apiPayload.errorCode === "string" ? apiPayload.errorCode : null;
  }

  private extractTimestamp(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const apiPayload = payload as Partial<ApiResult<unknown>>;
    return typeof apiPayload.timestamp === "string" ? apiPayload.timestamp : null;
  }
}
