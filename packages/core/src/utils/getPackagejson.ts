import path from 'path';
export const getCorePackageJSON = ()=>{
    return require(path.resolve(__dirname, '../../package.json'));
}

export const getProjectPackageJSON = ()=>{
    try{
        return require(path.resolve(process.cwd(), './package.json'))
    }catch(e){
        return undefined;
    }
}