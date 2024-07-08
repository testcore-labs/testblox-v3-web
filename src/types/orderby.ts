const enum orderby {
  ASCENDING = "ASC",
  DESCENDING = "DESC"
}

export function order_enum(str: string): orderby {
  switch (str) {
    case "ASC":
      return orderby.ASCENDING;
    case "DESC":
      return orderby.DESCENDING;
    default:
      return orderby.ASCENDING;
  }
}

export { orderby as orderby_enum };