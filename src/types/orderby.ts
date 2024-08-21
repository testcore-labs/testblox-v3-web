enum orderby {
  ASCENDING = "ASC",
  DESCENDING = "DESC"
}

export function validate_orderby(str: string, def: string = orderby.ASCENDING): orderby {
  switch (str) {
    case "ASC":
      return orderby.ASCENDING;
    case "DESC":
      return orderby.DESCENDING;
    default:
      return validate_orderby(def);
  }
}

export { orderby as orderby_enum };