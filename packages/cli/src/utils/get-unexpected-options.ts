import minimist from 'minimist';
import commander from 'commander';

//获取未声明的命令行传递的参数
export default (declaredOptions: commander.Option[])=>{
    const argv = minimist(process.argv.slice(2));

    //获取声明的options的参数 -a和--all作为黑名单
    const declaredOptionsStrings = declaredOptions.reduce((list:string[], option)=>{
        const {short='',long=''} = option;
        list.push(short.slice(1));
        list.push(long.slice(2));
        return list;
    }, []);

    return Object.keys(argv).reduce((unexpectedOPtions:{[key:string]:any}, key)=>{
        if(key!== '_' && !declaredOptionsStrings.includes(key)){
            return {
                ...unexpectedOPtions,
                [key]:argv[key]
            }
        }
        return unexpectedOPtions;
    },{})
}