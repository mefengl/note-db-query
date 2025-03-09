/**
 * 这个文件定义了处理数据库查询结果的核心类
 * 
 * 当我们从数据库查询数据时，我们会得到很多行(Rows)的数据，
 * 每一行(Row)又包含了多个不同类型的值。
 * 
 * 这个文件主要解决两个问题：
 * 1. 如何安全地遍历所有查询结果(Rows类)
 * 2. 如何安全地从每一行中提取正确类型的数据(Row类)
 * 
 * 想象一下，这就像是一个学校的成绩单：
 * - Rows类就像是所有学生的成绩表
 * - Row类就像是单个学生的成绩行
 * - 每个Row中的方法(如string, number)就像是安全地拿到特定科目成绩的方法
 */

/**
 * Rows类用于表示数据库查询的多行结果
 * 
 * 这个类可以让我们：
 * 1. 计算查询结果有多少行
 * 2. 使用for...of循环遍历所有结果行
 * 
 * 当你执行 db.query() 时，会得到这个类的实例。
 */
export class Rows {
	/**
	 * 存储原始的查询结果数据
	 * 这是一个二维数组，第一层表示行，第二层表示列
	 */
	private result: unknown[][];
	
	/**
	 * 构造函数，接收原始查询结果并保存
	 * 
	 * @param result 从数据库查询得到的原始结果，是一个二维数组
	 */
	constructor(result: unknown[][]) {
		this.result = result;
	}
	
	/**
	 * 这是一个特殊方法，让Rows类可以被for...of循环遍历
	 * 
	 * 例如：
	 * const rows = db.query("SELECT * FROM users");
	 * for (const row of rows) {
	 *   // 处理每一行数据
	 * }
	 * 
	 * 这比传统的for循环更加简洁优雅
	 * 
	 * @returns 一个迭代器，每次返回一个Row对象
	 */
	*[Symbol.iterator](): Iterator<Row> {
		for (const item of this.result) {
			yield new Row(item);
		}
	}
	
	/**
	 * 计算查询结果中有多少行
	 * 
	 * 例如，如果查询返回了10个用户，那么count()将返回10
	 * 
	 * @returns 行数
	 */
	public count(): number {
		return this.result.length;
	}
}

/**
 * Row类表示查询结果中的一行数据
 * 
 * 这个类提供了类型安全的方法来获取行中的不同类型的数据：
 * - string方法获取字符串
 * - number方法获取数字
 * - bigint方法获取大整数
 * - boolean方法获取布尔值
 * - bytes方法获取二进制数据
 * 
 * 每种方法都有一个Nullable版本，可以处理可能为null的值
 */
export class Row {
	/**
	 * 存储这一行的原始数据
	 */
	private result: unknown[];
	
	/**
	 * 构造函数，保存这一行的原始数据
	 * 
	 * @param result 表示一行数据的数组
	 */
	constructor(result: unknown[]) {
		this.result = result;
	}
	
	/**
	 * 获取指定位置的字符串值，该值可以为null
	 * 
	 * 如果值不是字符串也不是null，会抛出错误
	 * 
	 * 例如：
	 * const username = row.stringNullable(0); // 可能是字符串或null
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 字符串或null
	 */
	public stringNullable(index: number): string | null {
		const value = this.get(index);
		if (typeof value !== "string" && value !== null) {
			throw new Error("Not a string or null");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的字符串值，该值不能为null
	 * 
	 * 如果值不是字符串，会抛出错误
	 * 
	 * 例如：
	 * const username = row.string(0); // 一定是字符串
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 字符串
	 */
	public string(index: number): string {
		const value = this.get(index);
		if (typeof value !== "string") {
			throw new Error("Not a string");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的数字值，该值可以为null
	 * 
	 * 如果值不是数字也不是null，会抛出错误
	 * 
	 * 例如：
	 * const age = row.numberNullable(1); // 可能是数字或null
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 数字或null
	 */
	public numberNullable(index: number): number | null {
		const value = this.get(index);
		if (typeof value !== "number" && value !== null) {
			throw new Error("Not a number or null");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的数字值，该值不能为null
	 * 
	 * 如果值不是数字，会抛出错误
	 * 
	 * 例如：
	 * const age = row.number(1); // 一定是数字
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 数字
	 */
	public number(index: number): number {
		const value = this.get(index);
		if (typeof value !== "number") {
			throw new Error("Not a number");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的大整数值，该值可以为null
	 * 
	 * 如果值是整数，会自动转换为大整数
	 * 如果值不是大整数也不是整数也不是null，会抛出错误
	 * 
	 * 例如：
	 * const id = row.bigintNullable(2); // 可能是大整数或null
	 * 
	 * 大整数适合表示非常大的数，比如超过JavaScript安全整数范围(2^53-1)的数
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 大整数或null
	 */
	public bigintNullable(index: number): bigint | null {
		const value = this.get(index);
		if (typeof value === "number" && Number.isInteger(value)) {
			return BigInt(value);
		}
		if (typeof value !== "bigint" && value !== null) {
			throw new Error("Not an integer or null");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的大整数值，该值不能为null
	 * 
	 * 如果值是整数，会自动转换为大整数
	 * 如果值不是大整数也不是整数，会抛出错误
	 * 
	 * 例如：
	 * const id = row.bigint(2); // 一定是大整数
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 大整数
	 */
	public bigint(index: number): bigint {
		const value = this.get(index);
		if (typeof value === "number" && Number.isInteger(value)) {
			return BigInt(value);
		}
		if (typeof value !== "bigint") {
			throw new Error("Not an integer");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的布尔值，该值可以为null
	 * 
	 * 如果值不是布尔值也不是null，会抛出错误
	 * 
	 * 例如：
	 * const isAdmin = row.booleanNullable(3); // 可能是布尔值或null
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 布尔值或null
	 */
	public booleanNullable(index: number): boolean | null {
		const value = this.get(index);
		if (typeof value !== "boolean" && value !== null) {
			throw new Error("Not a boolean or null");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的布尔值，该值不能为null
	 * 
	 * 如果值不是布尔值，会抛出错误
	 * 
	 * 例如：
	 * const isAdmin = row.boolean(3); // 一定是布尔值
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 布尔值
	 */
	public boolean(index: number): boolean {
		const value = this.get(index);
		if (typeof value !== "boolean") {
			throw new Error("Not a boolean");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的二进制数据，该值可以为null
	 * 
	 * 如果值不是Uint8Array也不是null，会抛出错误
	 * 
	 * 例如：
	 * const profilePicture = row.bytesNullable(4); // 可能是二进制数据或null
	 * 
	 * 二进制数据通常用于存储图片、文件等非文本数据
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 二进制数据或null
	 */
	public bytesNullable(index: number): Uint8Array | null {
		const value = this.get(index);
		if (!(value instanceof Uint8Array) && value !== null) {
			throw new Error("Not an Uint8Array or null");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的二进制数据，该值不能为null
	 * 
	 * 如果值不是Uint8Array，会抛出错误
	 * 
	 * 例如：
	 * const profilePicture = row.bytes(4); // 一定是二进制数据
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 二进制数据
	 */
	public bytes(index: number): Uint8Array {
		const value = this.get(index);
		if (!(value instanceof Uint8Array)) {
			throw new Error("Not an Uint8Array");
		}
		return value;
	}
	
	/**
	 * 获取指定位置的原始值，不做类型检查
	 * 
	 * 这是一个底层方法，其他类型安全的方法内部都会调用它
	 * 一般情况下，推荐使用上面的类型安全方法而不是直接使用这个方法
	 * 
	 * @param index 要获取的列索引，从0开始
	 * @returns 任意类型的值
	 */
	public get(index: number): unknown {
		const value = this.result[index];
		return value;
	}
}
