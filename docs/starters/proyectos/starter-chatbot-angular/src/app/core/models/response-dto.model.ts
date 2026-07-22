export interface ErrorDetailDto {
    errorCode: string;
    errorMessage: string;
}

export interface ResponseDto<T> {
    responseCode: string;
    responseMessage: string;
    data: T;
    errorList: ErrorDetailDto[];
}
