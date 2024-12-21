import { CartContextProvider } from "@/components/CartContext";
import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
  body{
  padding:0;
  margin:0;
  background-color: #eee;
  font-family: "Roboto", sans-serif;
  }  
`;


export default function App({ Component, pageProps }) {
  return (
    <>
    <GlobalStyles />
    <CartContextProvider>
      <Component {...pageProps} />
    </CartContextProvider>
    </>
  );
}
