/**
 * 这个文件提供了异步数据库操作的功能
 * 
 * "异步"意味着数据库操作不会立即返回结果，而是返回一个Promise
 * 这适合那些需要非阻塞操作的应用，比如web服务器，可以在等待数据库操作完成的同时处理其他请求
 * 
 * 这个文件定义了两个重要的部分：
 * 1. AsyncDatabase类：提供异步数据库操作的方法
 * 2. AsyncAdapter接口：定义如何异步连接到特定的数据库系统
 * 
 * 这个文件的功能与sync.ts类似，但是所有操作都是异步的(Promise-based)
 * 如果你熟悉Promise和async/await，这个文件会很容易理解
 */

import { Row, Rows } from "./query.js";

/**
 * AsyncDatabase类提供异步数据库操作的方法
 * 
 * 这个类依赖于一个异步适配器来与特定的数据库系统通信
 * 所有的方法都返回Promise，可以使用async/await语法来处理
 * 
 * 适合用于：
 * - Node.js服务器
 * - 需要异步操作的浏览器应用
 * - 任何不希望数据库操作阻塞主线程的场景
 * 
 * 泛型参数_ExecuteResult表示执行非查询操作时的返回类型
 */
export class AsyncDatabase<_ExecuteResult> {
	/**
	 * 存储异步数据库适配器实例
	 * 这个适配器负责与特定数据库系统的异步通信
	 */
	private adapter: AsyncAdapter<_ExecuteResult>;
	
	/**
	 * 构造函数，接收并保存一个异步数据库适配器
	 * 
	 * 例如：
	 * const db = new AsyncDatabase(postgresAdapter);
	 * 
	 * @param adapter 实现了AsyncAdapter接口的适配器对象
	 */
	constructor(adapter: AsyncAdapter<_ExecuteResult>) {
		this.adapter = adapter;
	}
	
	/**
	 * 异步查询单行数据，如果没有结果则返回null
	 * 
	 * 这个方法适用于期望最多返回一行的查询
	 * 因为是异步的，需要使用await或.then()来获取结果
	 * 
	 * 例如：
	 * // 使用async/await
	 * const user = await db.queryOne("SELECT * FROM users WHERE id = ?", [123]);
	 * if (user) {
	 *   console.log("找到用户:", await user.string(1));
	 * }
	 * 
	 * // 或者使用Promise链式调用
	 * db.queryOne("SELECT * FROM users WHERE id = ?", [123])
	 *   .then(user => {
	 *     if (user) {
	 *       console.log("找到用户:", user.string(1));
	 *     }
	 *   });
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数数组，用于替换SQL语句中的占位符
	 * @returns Promise，解析为Row对象或null
	 */
	public async queryOne(statement: string, params: unknown[]): Promise<Row | null> {
		const result = await this.adapter.query(statement, params);
		if (result.length < 1) {
			return null;
		}
		return new Row(result[0]);
	}
	
	/**
	 * 异步查询单行数据，如果没有结果则抛出错误
	 * 
	 * 这个方法适用于必须返回一行的查询
	 * 如果查询没有返回任何行，Promise会被拒绝(reject)
	 * 
	 * 例如：
	 * try {
	 *   const settings = await db.queryOneOrThrow("SELECT * FROM settings WHERE key = ?", ["theme"]);
	 *   // 处理设置
	 * } catch (error) {
	 *   console.error("必需的设置不存在!");
	 * }
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数数组，用于替换SQL语句中的占位符
	 * @returns Promise，解析为Row对象
	 * @throws 如果没有结果，Promise会被拒绝
	 */
	public async queryOneOrThrow(statement: string, params: unknown[]): Promise<Row> {
		const row = await this.queryOne(statement, params);
		if (row === null) {
			throw new Error("Query did not return any rows");
		}
		return row;
	}
	
	/**
	 * 异步查询多行数据
	 * 
	 * 这个方法适用于期望返回多行结果的查询
	 * 返回的Rows对象可以通过for...of循环遍历
	 * 
	 * 例如：
	 * const activeUsers = await db.query("SELECT * FROM users WHERE active = ?", [true]);
	 * console.log(`有${activeUsers.count()}个活跃用户`);
	 * for (const user of activeUsers) {
	 *   console.log(user.string(1)); // 输出用户名
	 * }
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数数组，用于替换SQL语句中的占位符
	 * @returns Promise，解析为Rows对象
	 */
	public async query(statement: string, params: unknown[]): Promise<Rows> {
		const result = await this.adapter.query(statement, params);
		return new Rows(result);
	}
	
	/**
	 * 异步执行不返回数据的SQL语句，如INSERT、UPDATE、DELETE等
	 * 
	 * 这个方法适用于修改数据库的操作
	 * 返回值类型取决于适配器的实现
	 * 
	 * 例如：
	 * const result = await db.execute(
	 *   "INSERT INTO users (username, email) VALUES (?, ?)",
	 *   ["张三", "zhangsan@example.com"]
	 * );
	 * console.log("插入成功，影响的行数:", result.affectedRows);
	 * 
	 * @param statement SQL执行语句
	 * @param params 执行参数数组，用于替换SQL语句中的占位符
	 * @returns Promise，解析为执行结果
	 */
	public async execute(statement: string, params: unknown[]): Promise<_ExecuteResult> {
		return await this.adapter.execute(statement, params);
	}
}

/**
 * AsyncAdapter接口定义了异步数据库适配器必须实现的方法
 * 
 * 这个接口让AsyncDatabase类可以与不同的异步数据库系统一起使用
 * 开发者可以为不同的数据库系统实现这个接口
 * 
 * 例如可以实现：
 * - MySQL的异步适配器
 * - PostgreSQL的异步适配器
 * - MongoDB的异步适配器等
 * 
 * 与SyncAdapter不同，这里的方法都返回Promise
 * 
 * 泛型参数_ExecuteResult表示执行非查询操作时的返回类型
 */
export interface AsyncAdapter<_ExecuteResult> {
	/**
	 * 异步执行查询并返回结果行
	 * 
	 * @param statement SQL查询语句
	 * @param params 查询参数
	 * @returns Promise，解析为二维数组(外层表示行，内层表示列)
	 */
	query(statement: string, params: unknown[]): Promise<unknown[][]>;
	
	/**
	 * 异步执行非查询操作，如INSERT、UPDATE、DELETE等
	 * 
	 * @param statement SQL执行语句
	 * @param params 执行参数
	 * @returns Promise，解析为执行结果
	 */
	execute(statement: string, params: unknown[]): Promise<_ExecuteResult>;
}
