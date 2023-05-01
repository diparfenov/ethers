import walletProvider from "../walletProvider";
import primitives from "./primitives"

const getPrimitivesWithSigner = async () => {
    const signer = await walletProvider.getSigner();
    const primitivesWithSigner = primitives.connect(signer);
    // второй варинат вместо провайдера использовать signer
    // const primitivesWithSigner = new Contract(process.env.primitivesAddress, abi, signer);
    return primitivesWithSigner;
  };

  export default getPrimitivesWithSigner;