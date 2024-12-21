import Button from "@/components/Button";
import { CartContext } from "@/components/CartContext";
import Center from "@/components/Center";
import Header from "@/components/Header";
import Input from "@/components/Input";
import Table from "@/components/Table";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";

const ColumnsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  margin-top: 40px;
`;

const Box = styled.div`
  background-color: #fff;
  border-radius: 10px;
  padding: 30px;
`;

const ProductInfoCell = styled.td`
  padding: 10px 0;
`;

const ProductImageBox = styled.div`
  width: 100px;
  height: 100px;
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  img {
    max-width: 80px;
    max-height: 80px;
  }
`;

const QuantityLabel = styled.span`
  padding: 0 3px;
`;

const CityHolder = styled.div`
  display: flex;
  gap: 5px;
`;

const Cart = () => {
  const { cartProducts, addProduct, removeProduct, clearCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");  // Add phone state
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [country, setCountry] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (cartProducts.length > 0) {
      axios.post("/api/cart", { ids: cartProducts }).then((response) => {
        setProducts(response.data);
      });
    } else {
      setProducts([]);
    }
  }, [cartProducts]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.location.href.includes("success")) {
      setIsSuccess(true);
      clearCart();
    }
  }, []);

  function moreOfThisProduct(id) {
    addProduct(id);
  }

  function lessOfThisProduct(id) {
    removeProduct(id);
  }

  // Function to initiate payment
  async function goToPayment() {
    if (!name || !email || !phone || !city || !postalCode || !streetAddress || !country) {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const response = await axios.post("/api/checkout", {
            name,
            email,
            phone,
            city,
            postalCode,
            streetAddress,
            country,
            cartProducts,
        });

        if (response?.data?.url) {
            // Redirect to Khalti's payment page
            window.location.href = response.data.url;
        } else {
            console.error("Payment initiation failed:", response);
            alert("Payment initiation failed. Please try again.");
        }
    } catch (error) {
        console.error("Error initiating payment:", error.message);
        alert("An error occurred while processing your payment. Please try again later.");
    }
}


  let total = 0;
  for (const productId of cartProducts) {
    const price = products.find((p) => p._id === productId)?.price || 0;
    total += price;
  }

  if (isSuccess) {
    return (
      <>
        <Header />
        <Center>
          <ColumnsWrapper>
            <Box>
              <h1>Thanks for your order!</h1>
              <p>We will email you when your order is sent.</p>
            </Box>
          </ColumnsWrapper>
        </Center>
      </>
    );
  }

  return (
    <>
      <Header />
      <Center>
        <ColumnsWrapper>
          <Box>
            <h2>Cart</h2>
            {!cartProducts?.length && <div>Your cart is empty</div>}
            {products?.length > 0 && (
              <Table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id}>
                      <ProductInfoCell>
                        <ProductImageBox>
                          <img src={product.images[0]} alt="cart-img" />
                        </ProductImageBox>
                        {product.title}
                      </ProductInfoCell>
                      <td>
                        <Button onClick={() => lessOfThisProduct(product._id)}>-</Button>
                        <QuantityLabel>{cartProducts.filter((id) => id === product._id).length}</QuantityLabel>
                        <Button onClick={() => moreOfThisProduct(product._id)}>+</Button>
                      </td>
                      <td>Rs {cartProducts.filter((id) => id === product._id).length * product.price}</td>
                    </tr>
                  ))}
                  <tr>
                    <td></td>
                    <td></td>
                    <td>Rs {total}</td>
                  </tr>
                </tbody>
              </Table>
            )}
          </Box>
          {!!cartProducts?.length && (
            <Box>
              <h2>Order information</h2>
              <Input type="text" value={name} name="name" onChange={(ev) => setName(ev.target.value)} placeholder="Name" />
              <Input type="text" value={email} name="email" onChange={(ev) => setEmail(ev.target.value)} placeholder="Email" />
              <Input type="text" value={phone} name="phone" onChange={(ev) => setPhone(ev.target.value)} placeholder="Phone" />
              <CityHolder>
                <Input type="text" value={city} name="city" onChange={(ev) => setCity(ev.target.value)} placeholder="City" />
                <Input type="text" value={postalCode} name="postalCode" onChange={(ev) => setPostalCode(ev.target.value)} placeholder="Postal Code" />
              </CityHolder>
              <Input type="text" value={streetAddress} name="streetAddress" onChange={(ev) => setStreetAddress(ev.target.value)} placeholder="Street Address" />
              <Input type="text" value={country} name="country" onChange={(ev) => setCountry(ev.target.value)} placeholder="Country" />
              <Button onClick={goToPayment} black block>Continue to payment</Button>
            </Box>
          )}
        </ColumnsWrapper>
      </Center>
    </>
  );
};

export default Cart;
