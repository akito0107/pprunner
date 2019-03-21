export function convert(errors: any) {
  return Object.keys(errors).reduce((prev, o) => {
    if (errors[o].error) {
      return {
        ...prev,
        [o]: errors[o].message
      };
    }
    return prev;
  }, {});
}
