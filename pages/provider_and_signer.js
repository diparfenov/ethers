import { formatEther, parseEther } from "ethers";
import { useEffect, useRef, useState } from "react";
import defaultProvider from "../abi/defaultProvider";
import walletProvider from "../abi/walletProvider";
import Layout from "../components/Layout";
import { useAppContext } from "../hooks/useAppContext";


const ProviderAndSigner = () => {
    const [etherBalance, setEtherBalance] = useState();

    const { contextState, updateContextState } = useAppContext();
    const currentAccount = contextState?.currentAccount;

    const toRef = useRef();
    const amountRef = useRef();

    const getBalance = async () => {
        const balance = await defaultProvider.getBalance(currentAccount);
        return formatEther(balance);
    };

    useEffect(() => {
        //Есть два варианта
        //присваиваем стейту то что выведет в return getBalance()
        //getBalance().then(setEtherBalance).catch(console.error);
        //создать асинхронную безымяную функцию, потому что useEffect не может быть асинхронным
        //и там setEtherBalance присвоить результат getBalance() с await
        (async () => {
            try {
                //только в случае, если есть аккаунт доставать баланс
                currentAccount && setEtherBalance(await getBalance());
                //отлавливаем ошибку в консоль
            } catch (error) {
                //берем всю информацию об ошибке
                console.error(error);
                //берем только код ошибки
                console.error(error.code);
                //берем только сообщение ошибки
                console.error(error.message);
            }
        })();
    }, [currentAccount]); // выполняется при изменении аккаунта

    //подключение к ММ, достаем массив аккаунта и передает в стейт текущий
    //два варианта подключения
    const handleConnectClick = async () => {
        const accounts = await walletProvider.send("eth_requestAccounts", []);
        const accountsMM = await window.ethereum.request({
            method: "eth_requestAccounts",
            params: [],
        });
        console.log("accounts: ", accounts);
        console.log("accountsMM: ", accountsMM);
        updateContextState({ currentAccount: accounts[0] });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const signer = await walletProvider.getSigner();
            const tx = await signer.sendTransaction({
                to: toRef.current.value,
                value: parseEther(amountRef.current.value),
            });
            console.log("tx: ", tx);
            console.log("tx hash: ", tx.hash);
            const response = await tx.wait();
            console.log("response: ", response);
            console.log("tx finished");
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Layout>
            <h1>Address: {currentAccount}</h1>
            <h1>Balance: {etherBalance}</h1>
            <button onClick={handleConnectClick}>Connect</button>
            <form onSubmit={handleSubmit}>
                <label htmlFor="to">To</label>
                <input
                    style={{ width: "500px" }}
                    ref={toRef}
                    name="to"
                    type="text"
                />
                <label htmlFor="amount">Amount</label>
                <input
                    ref={amountRef}
                    name="amount"
                    step="0.01"
                    type="number"
                />
                <button>Send</button>
            </form>
        </Layout>
    );
};

export default ProviderAndSigner;
