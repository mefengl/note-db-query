/**
 * 这是整个数据库查询库的入口文件
 * 
 * 这个文件的作用是把其他文件中定义的重要类和接口暴露出来，
 * 让使用这个库的人可以直接导入他们需要的功能。
 * 
 * 就像一个大型商场的导购图，告诉顾客：
 * - 想要处理数据行？使用 Row 和 Rows 类
 * - 需要同步数据库操作？使用 SyncDatabase 和 SyncAdapter
 * - 需要异步数据库操作？使用 AsyncDatabase 和 AsyncAdapter
 * 
 * 通过这个文件，使用者不需要知道具体功能在哪个文件里实现的，
 * 只要从这个入口导入就可以了。
 */

// 从 query.js 文件导出 Row 和 Rows 类，用于处理查询结果
export { Row, Rows } from "./query.js";

// 从 sync.js 文件导出 SyncDatabase 类，用于处理同步数据库操作
export { SyncDatabase } from "./sync.js";

// 从 async.js 文件导出 AsyncDatabase 类，用于处理异步数据库操作
export { AsyncDatabase } from "./async.js";

// 导出 SyncAdapter 类型，这是一个接口，用于定义同步数据库适配器的结构
export type { SyncAdapter } from "./sync.js";

// 导出 AsyncAdapter 类型，这是一个接口，用于定义异步数据库适配器的结构
export type { AsyncAdapter } from "./async.js";
