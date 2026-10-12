export function loginErrorMessage(code: string | undefined, status?: number) {
 switch (code) {
  case "invalid_credentials":
   return "이메일 또는 비밀번호가 맞지 않습니다. FEVER에 가입할 때 입력한 정보로 로그인해 주세요.";
  case "email_not_confirmed":
   return "이 계정의 이메일 확인 상태를 운영진이 확인해야 합니다. 이전에 이메일 인증을 사용하던 때 만든 계정일 수 있습니다. 가입 승인과는 별개의 문제입니다.";
  case "user_banned":
   return "이 계정은 로그인이 제한되어 있습니다. 운영진에게 문의해 주세요.";
  case "email_provider_disabled":
   return "현재 이메일 로그인을 사용할 수 없습니다. 운영진에게 서비스 연결 설정 확인을 요청해 주세요.";
  case "over_request_rate_limit":
  case "over_email_send_rate_limit":
   return "로그인 요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요.";
  default:
   return status === 429 ? "로그인 요청이 많습니다. 잠시 기다린 뒤 다시 시도해 주세요." : "로그인 서비스에 문제가 있습니다. 잠시 후 다시 시도하거나 운영진에게 문의해 주세요.";
 }
}
