function rbx_time(date: Date) { // 1970-01-01T00:00:00Z
  return date.toISOString().split('.')[0] + 'Z';
}