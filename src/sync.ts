/**
 * 这个文件提供了同步数据库操作的功能
 * 
 * "同步"意味着数据库操作会立即返回结果，程序会等待操作完成
 * 这适合那些不需要异步处理的简单数据库操作
 * 
 * 这个文件定义了两个重要的部分：
 * 1. SyncDatabase类：提供同步数据库操作的方法
 * 2. SyncAdapter接口：定义如何连接到特定的数据库系统
 * 
 * 这就像是：
 * - SyncDatabase是一个通用的遥控器
 * - SyncAdapter是针对特定电器(如电视、空调)的适配器
 * - 通过适配器，同一个遥控器可以控制不同的电器
 */

import { Row, Rows } from "./query.js";

/**
 * SyncDatabase类提供同步数据库操作的方法
 * 
 * 这个类依赖于一个适配器来与特定的数据库系统通信
 * 用户可以使用这个类来执行SQL查询和命令，而不需要关心底层实现细节
 * 
 * 泛型参数_ExecuteResult表示执行非查询操作时的返回类型
 * 不同的数据库系统可能返回不同的结果类型
 */
export class SyncDatabase<_ExecuteResult> {
	/**
	 * 存储数据库适配器实例
	 * 这个适配器负责与特定数据库系统通信
	 */
	private adapter: SyncAdapter<_ExecuteResult>;
	
	/**
	 * 构造函数，接收并保存一个数据库适配器
	 * 
	 * 例如：
	 * const db = new SyncDatabase(sqliteAdapter);
	 * 
	 * @param adapter 实现了SyncAdapter接口的适配器对象
	 */
	constructor(adapter: SyncAdapter<_ExecuteResult>) {
		this.adapter = adapter;
	}
	
	/**
	 * 查询单行数据，如果没有结果则返回null
	 * 
	 * 这个方法适用于期望最多返回一行的查询
	 * 比如通过唯一ID查找用户：
	 * 
	 * const user = db.queryOne("SELECT * FROM users WHERE id = ?", [123]);
	 * if (user) {
	 *   console.log("找到用户:", user.string(1)); // 使用用户名
	 * } else {
	 *   console.log("用户不存在");
	 * }
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数数组，用于替换SQL语句中的占位符
	 * @returns 如果有结果则返回Row对象，否则返回null
	 */
	public queryOne(statement: string, params: unknown[]): Row | null {
		const result = this.adapter.query(statement, params);
		if (result.length < 1) {
			return null;
		}
		return new Row(result[0]);
	}
	
	/**
	 * 查询单行数据，如果没有结果则抛出错误
	 * 
	 * 这个方法适用于必须返回一行的查询
	 * 如果确定结果一定存在，使用这个方法可以省去null检查
	 * 
	 * 例如：
	 * try {
	 *   const settings = db.queryOneOrThrow("SELECT * FROM settings WHERE key = ?", ["theme"]);
	 *   // 处理设置
	 * } catch (error) {
	 *   console.error("必需的设置不存在!");
	 * }
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数数组，用于替换SQL语句中的占位符
	 * @returns Row对象
	 * @throws 如果没有结果则抛出错误
	 */
	public queryOneOrThrow(statement: string, params: unknown[]): Row {
		const row = this.queryOne(statement, params);
		if (row === null) {
			throw new Error("Query did not return any rows");
		}
		return row;
	}
	
	/**
	 * 查询多行数据
	 * 
	 * 这个方法适用于期望返回多行结果的查询
	 * 返回的Rows对象可以通过for...of循环遍历
	 * 
	 * 例如查询所有活跃用户：
	 * const activeUsers = db.query("SELECT * FROM users WHERE active = ?", [true]);
	 * console.log(`有${activeUsers.count()}个活跃用户`);
	 * for (const user of activeUsers) {
	 *   console.log(user.string(1)); // 输出用户名
	 * }
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数数组，用于替换SQL语句中的占位符
	 * @returns Rows对象，包含查询结果
	 */
	public query(statement: string, params: unknown[]): Rows {
		const result = this.adapter.query(statement, params);
		return new Rows(result);
	}
	
	/**
	 * 执行不返回数据的SQL语句，如INSERT、UPDATE、DELETE等
	 * 
	 * 这个方法适用于修改数据库的操作
	 * 返回值类型取决于适配器的实现
	 * 
	 * 例如插入新用户：
	 * const result = db.execute(
	 *   "INSERT INTO users (username, email) VALUES (?, ?)",
	 *   ["张三", "zhangsan@example.com"]
	 * );
	 * // result可能包含受影响的行数、插入的ID等信息，取决于数据库适配器
	 * 
	 * @param statement SQL执行语句
	 * @param params 执行参数数组，用于替换SQL语句中的占位符
	 * @returns 执行结果，类型由适配器决定
	 */
	public execute(statement: string, params: unknown[]): _ExecuteResult {
		return this.adapter.execute(statement, params);
	}
}

/**
 * SyncAdapter接口定义了同步数据库适配器必须实现的方法
 * 
 * 这个接口让SyncDatabase类可以与不同的数据库系统一起使用
 * 开发者可以为不同的数据库系统实现这个接口
 * 
 * 例如可以实现SQLite适配器、MySQL适配器等
 * 
 * 泛型参数_ExecuteResult表示执行非查询操作时的返回类型
 */
export interface SyncAdapter<_ExecuteResult> {
	/**
	 * 执行查询并返回结果行
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数
	 * @returns 二维数组，外层表示行，内层表示列
	 */
	query(statement: string, params: unknown[]): unknown[][];
	
	/**
	 * 执行非查询操作，如INSERT、UPDATE、DELETE等
	 * 
	 * @param statement SQL执行语句
	 * @param params 执行参数
	 * @returns 执行结果，类型由具体实现决定
	 */
	execute(statement: string, params: unknown[]): _ExecuteResult;
}
