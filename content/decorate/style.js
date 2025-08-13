export default (withStyle) =>
{
    return {
        padding: (pad) => withStyle({
            padding: `${pad}px`,
        }),
    }
}