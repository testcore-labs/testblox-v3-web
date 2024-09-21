import sql, { type postgres } from "../sql";
import type _ENUM from "../types/enums"; 
import ENUM from "../types/enums"; 
import { validate_orderby } from "../types/orderby"; 
import _ from "lodash"; 
import type { PendingQuery, Row } from "postgres";

class query_builder {
  v_selected: string = "*";
  v_table: string = "";
  v_single: boolean = false;
  v_limit: number | null = null;
  v_order_by: { column: string | null; direction: keyof typeof _ENUM.order | string | null } = { column: null, direction: null };
  v_conditions: PendingQuery<Row[]>[] = [];
  v_search: PendingQuery<Row[]>[] = [];
  v_search_columns: string[] = [];
  v_safe_sorts: string[]|{ [key: string]: string } = [];
  v_offset: number | null = null;
  v_page: number | null = null;
  v_randomize_sort: boolean = false;
  v_condition_separator: string = "AND";
  v_search_separator: string = "OR";

  private safe_number(number: number) {
    return _.clamp(number,-2^31, 2^31-1)
  }

  select(select: string[]) {
    this.v_selected = "";
    select.forEach((select_key) => {
      this.v_selected += select_key + ((select.at(-1) === select_key) ? "" : ", ");
    })
    return this;
  }

  table(table: string) {
    this.v_table = table;
    return this;
  }

  where(sql: PendingQuery<Row[]>) {
    this.v_conditions.push(sql);
    return this;
  }

  search(str: string, columns: string | Array<string> = [], partial_search: boolean = false) {
    if (!str) return this;
    const column_array = typeof columns === "string" ? [columns] : columns;

    // TODO: partial_search
    str = str.trimStart().trimEnd()
    if(str.length == 0) return this;

    const search = `${str}:*`;
    this.v_search = Object.assign(this.v_search, column_array.map(column => 
     sql`(to_tsvector(${sql(column)}) ${ sql.unsafe(`@@`) } phraseto_tsquery(${search}))`
    ));

    return this;
  }

  separate(separator: string) {
    this.v_condition_separator = separator;
    return this;
  }
  
  search_separate(separator: string) {
    this.v_search_separator = separator;
    return this;
  }
  
  limit(limit: number) {
    this.v_limit = this.safe_number(limit);
    return this;
  }

  single() {
    this.v_limit = 1;
    this.v_single = true;
    return this;
  }
  
  order(column: string, direction: string = ENUM.order.ASCENDING) {
    direction = validate_orderby(direction);
    this.v_order_by.column = column;
    this.v_order_by.direction = direction;
    return this;
  }

  direction(direction: string = ENUM.order.ASCENDING) {
    direction = validate_orderby(direction);
    this.v_order_by.direction = direction;
    return this;
  }

  sort(column: string) {
    this.v_order_by.column = column;
    return this;
  }

  randomize(bool: boolean = true) {
    this.v_randomize_sort = bool;
    return this;
  }

  sort_safe(column: string, columns: string[] | { [key: string]: string }) {
    this.v_safe_sorts = columns;
    if(Object.entries(columns).find(([_nick, col]) => { const val = col.toLowerCase().includes(column.toLowerCase()); return val; } )) {
      this.v_order_by.column = column;
    }
    return this;
  }

  offset(offset: number) {
    this.v_offset = this.safe_number(offset);
    return this;
  }

  page(page: number) {
    const offset = (page - 1) * (this.v_limit ?? 1);
    this.v_offset = this.safe_number(offset);
    this.v_page = this.safe_number(page);
    return this;
  }

  private where_mapper(pending_row: PendingQuery<Row[]>[], separator: string = ` AND `) { 
    return pending_row.length != 0
      ? pending_row.flatMap((x, i) => i ? [sql.unsafe(separator), x] : x)
      : sql`true`;
  }
  

  async exec() {
    let select_stmt = sql`SELECT *
    FROM ${ sql(this.v_table) }
    WHERE (${ this.where_mapper(this.v_search, this.v_search_separator) }) AND
    (${ this.where_mapper(this.v_conditions, this.v_condition_separator) })
    ORDER BY 
      ${ this.v_order_by.column != "undefined" && (typeof this.v_order_by.column === "string") 
        ? sql(this.v_order_by.column) 
        : (this.v_randomize_sort 
          ? sql.unsafe(`RANDOM()`) 
          : sql.unsafe(`1`)) } 
      ${ sql.unsafe(this.v_order_by.direction ?? "ASC") }
    LIMIT ${this.v_limit} OFFSET ${this.v_offset}`;

    let select_cnt = sql`SELECT COUNT(*) FROM ${ sql(this.v_table) }`;
    
    const [data, count] = await Promise.all([
      select_stmt,
      select_cnt
    ]);

    const total_items = Number(count[0].count);
    const total_pages = Math.ceil(total_items / (this.v_limit ?? 1));
    return this.v_single
      ? data[0]
      : { 
        data: data,
        total_count: total_items, // pagination
        pages: total_pages,
        page: this.v_page,
        order: this.v_order_by,
        sorts: this.v_safe_sorts,
      };
  }
}

// extend this
class entity_base {
  table: string = "";
  data: { [key: string]: any };

  constructor() {
    this.data = {}
  }

  async _updateat() {
    return await sql`UPDATE ${ sql(this.table) } SET "updatedat" = ${Date.now()} WHERE "id" = ${this.data?.id}`;
  }

  get exists() {
    return Object.keys(this.data ?? {}).length !== 0;
  }

  static query() {
    let query = new query_builder;
    query = query.table((new this).table);
    return query;
  }

  static async insert(data: { [key: string|number|symbol]: any } = {}, return_data: boolean = false) {
    let returned_data;
    let st = await sql`
      INSERT INTO "users" ${sql(data)}
      ${ return_data ? sql.unsafe(`RETURNING *`) : sql`` }`;

    if(return_data) returned_data = st;
    return returned_data;
  }
  static async insert_many(datas: Array<{ [key: string|number|symbol]: any }> = [], return_data: boolean = false) {
    let returned_data = [];

    let st = await sql`
      INSERT INTO "users" ${sql(datas)}
      ${ return_data ? sql.unsafe(`RETURNING *`) : sql`` }`;

    if(return_data) returned_data.push(st[0]);
    return returned_data;
  }

  async by(query: query_builder) {
    const data = await query
      .single()
      .exec();

    this.data = data;
    return this;
  }
}

export default entity_base;
export { query_builder };