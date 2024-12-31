export const getDomainName = (): string => {
    return window.location.hostname.split(".").slice(-2).join(".");
  };