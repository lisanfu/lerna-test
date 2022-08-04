# 从工程化角度出发的脚手架
### 前端脚手架的由来
从刀耕火种的年代说起，貌似有点遥远。那咱们就从盘古开天的混沌世界娓娓道来，夸父追日的故事，相比大家耳熟能详。那咱们就另辟蹊径，来探讨探讨下夸父为什么追日。
故事开始要从那个梦开始，在一个静谧祥和的夜晚，和往常没有太大的不同，也没有天降异象，一切是那么平淡而普通。一切如常，正常进入梦乡
### 前端脚手架的现状

### 提供的解决方案

### 设计思路

### 如何使用

包管理案例
# lerna 管理工具使用

## 全局安装lerna
> yarn add lerna

## 用lerna初始化项目
> lerna init

## 用lerna创建包

> lerna create core

## lerna 管理依赖
1. 给所有包安装依赖
> lerna add npmlog
2. 给指定包安装依赖
> lerna add 依赖名称 包路径
3. 卸载指定包依赖
> lerna exec --scope=core  npm uninstall inquirer
4. 清除所有包安装依赖
> lerna clean

5. 重新安装删除的依赖
> lerna bootstrap
6. 创建项目内部之前的软连接
> lerna link

7. 执行命令
> lerna exec --scope 包名 -- 终端命令

8. 执行测试
> lerna run test

9. 对指定包执行npm 命令
> lerna run --scope 包名 -- npm命令
## 发布脚手架

1. 查看与上次发布的版本之间的变更
> lerna changed
2. 查看与上次本地提交之间的变更
> lerna diff

3. 发布到npm
> lerna publish

## 开发流程

### 脚手架项目初始化
1. 初始化npm项目-----> 安装lerna-----> lerna init 初始化项目
### 创建packages
1. lerna create 创建package ---> lerna add 安装依赖----> lerna link 链接依赖
### 脚手架开发测试
1. lerna exec执行shell脚本----> lerna run 执行npm 命令----> lerna clean 清空依赖----> lerna bootstrap 重装依赖

### 脚手架发布上线
1. lerna version / bump version --->lerna changed 查看版本变更--->lerna diff 查看diff--->lerna publish 发布上线

###简单搭建脚手架


