# lerna-test
包管理案例
# lerna 管理工具使用

1. 全局安装lerna
> yarn add lerna

2. 用lerna初始化项目
> lerna init

3. 用lerna创建包

> lerna create core

4. lerna 管理依赖
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