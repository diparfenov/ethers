import { Typed } from "ethers";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import getStrangeFactoryWithSigner from "../../abi/strangeFactory/getStrangeFactoryWithSigner";
import strangeFactory from "../../abi/strangeFactory/strangeFactory";
import Layout from "../../components/Layout";

const StrangeFactory = () => {
  const [titledContracts, setTitledContracts] = useState([]);
  const [currentTitledContractsLoaded, setCurrentTitledContractsLoaded] = useState(0);
  const [isAllLoaded, setAllLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const stringRef = useRef();
  const numberRef = useRef();
  const router = useRouter();

  //выбираем сколько хотим прогрузить в первый раз
  //по кнопке можно будет прогрузить еще, пока не закончится
  const WANT_TO_LOAD = 5;

  //тут проходимся по всем существующим контрактом в массиве и добавляем их в стейт setTitledContracts
  //проходимся до тех пор пока не кончатся адреса в массиве
  useEffect(() => {
    (async () => {
      try {
        for (
          let i = currentTitledContractsLoaded;
          i < currentTitledContractsLoaded + WANT_TO_LOAD;
          i++
        ) {
          const titled = await strangeFactory.titledContracts(i);
          setTitledContracts((prev) => [...prev, titled]); //обязательно использовать prev чтобы старые сохранлись тоже
        }
      } catch (error) {
        console.error(error);
        //если выпадает ошибка, значит массив пуст и тогда в стейт isAllLoaded попадает true значит все загрузилось
        //и кнопка прибавления для дозагрузки пропадает
        setAllLoaded(true);
      }
    })();
  }, [currentTitledContractsLoaded]);

  const handleAddUntitledContractClik = async () => {
    try {
      const strangeFactoryWithSigner = await getStrangeFactoryWithSigner();
      const tx = await strangeFactoryWithSigner.add();
      console.log("tx: ", tx);
      const response = await tx.wait();
      console.log("response: ", response);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddStringContractSubmit = async (event) => {
    event.preventDefault();
    try {
      const strangeFactoryWithSigner = await getStrangeFactoryWithSigner();
      const tx = await strangeFactoryWithSigner["add(string)"](
        stringRef.current.value
      );
      console.log("tx: ", tx);
      // это еще варианты читать ивенты  но их надо чистить
      // strangeFactoryWithSigner.on("ContractCreation", (result) => {console.log("on event: ", result)});
      // strangeFactoryWithSigner.on("*", (result) => {console.log("on all event: ", result)});
      //это мы читаем event и как только мы его получаем нас сразу кидает на страницу /strange_factory/titled
      strangeFactoryWithSigner.once("ContractCreation", (address) => {
        //используя такой метод перегазрузка не произойдет и тсейт сохрантяся
        router.push({
          pathname: "/strange_factory/titled",
          query: { address }, // { address: address }
        });
      });
      const response = await tx.wait();
      console.log("response: ", response);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddNumberContractSubmit = async (event) => {
    event.preventDefault();
    try {
      const strangeFactoryWithSigner = await getStrangeFactoryWithSigner();
      const tx = await strangeFactoryWithSigner.add(
        Typed.uint256(numberRef.current.value)
      );

      console.log("tx: ", tx);
      const response = await tx.wait();
      console.log("response: ", response);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveLastClick = async () => {
    setErrorMessage("");
    try {
      const price = await strangeFactory.priceOfRemoving();
      const tx = await (await getStrangeFactoryWithSigner()).removeLast({value: price}); //{value: price, gasLimit: 10n ** 10n}
      console.log("tx: ", tx);
      const response = await tx.wait();
      console.log("response: ", response);
    } catch (error) {
      console.error(error);
      console.log(Object.entries(error));
      setErrorMessage(error.reason);
    }
  };

  handleRemoveLastClick;

  return (
    <Layout>
      <h4>List of current titled:</h4>
      <ol>
        {titledContracts.map((titledContract, index) => (
          <li key={index}>
            <Link
              href={{
                pathname: "/strange_factory/titled",
                query: { address: titledContract },
              }}
            >
              {titledContract}
            </Link>
          </li>
        ))}
      </ol>
      {!isAllLoaded && (
        <button
          onClick={() => {
            setCurrentTitledContractsLoaded(
              currentTitledContractsLoaded + WANT_TO_LOAD
            );
          }}
        >
          Load {WANT_TO_LOAD} more
        </button>
      )}
      <h3>Add more contracts</h3>
      <button onClick={handleAddUntitledContractClik}>
        Add untitled contract
      </button>
      <form onSubmit={handleAddStringContractSubmit}>
        <label htmlFor="name">Contract title</label>
        <input ref={stringRef} name="name" type="text" />
        <button>Create</button>
      </form>
      <form onSubmit={handleAddNumberContractSubmit}>
        <label htmlFor="number">Contract number</label>
        <input ref={numberRef} name="number" type="number" step={1} min={0} />
        <button>Create</button>
      </form>
      <button onClick={handleRemoveLastClick}>Remove last</button>
      <br />
      <span>{errorMessage}</span>
    </Layout>
  );
};

export default StrangeFactory;