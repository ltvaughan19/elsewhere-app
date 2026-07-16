interface CountryIdentityMarkProps {
  isoCode: string;
  countryName: string;
  size?: "small" | "large";
}

export function CountryIdentityMark({
  isoCode,
  countryName,
  size = "large",
}: CountryIdentityMarkProps) {
  const isLarge = size === "large";

  return (
    <span
      className={`country-identity-mark ${
        isLarge ? "h-20 w-20 sm:h-24 sm:w-24" : "h-14 w-14"
      }`}
      aria-label={`${countryName}, country code ${isoCode}`}
    >
      <span
        aria-hidden="true"
        className={isLarge ? "text-2xl sm:text-3xl" : "text-lg"}
      >
        {isoCode}
      </span>
    </span>
  );
}
