export default (args:any[])=>{
    const argumentsIndex = args.findIndex(v=>typeof v==='object');
    return {
        arguments:args.slice(0, argumentsIndex),
        options: args[argumentsIndex],
        command: args[argumentsIndex+1]
    }
}