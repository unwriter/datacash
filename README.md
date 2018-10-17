# Datacash

![logo](logo.png)

Datacash is the simplest library for building and broadcasting Bitcoin Cash OP_RETURN transactions.

---

# Preview

Post to the blockchain with just 4 lines of code. 

![code](code.png)

---

# Demo

## 1. Datacash Transaction Composer

- [Datacash transaction composer](https://unwriter.github.io/datacash/example/composer.html)

- [View source](example/composer.html)

## 2. Microblogging Playground

Post to both Memo.cash and Blockpress with a single interface.

- [DEMO](https://unwriter.github.io/datacash/example/playground.html)

- [View source](example/playground.html)

---


# Install

## 1. In node.js

```
npm install datacash
```

and then require it

```
const datacash = require('datacash')
```

## 2. In browser

```
<script src='https://unpkg.com/datacash'></script>
```

---

# Quickstart

Send `"Hello from datacash"` to [memo.cash](https://memo.cash) in 5 lines of code.


```
const privateKey = [YOUR PRIVATE KEY HERE];
datacash.send({
  data: ["0x6d02", "Hello from datacash"],
  cash: { key: privateKey }
});
```

Above code builds an `OP_RETURN` transaction with `0x6d02 hello` as push data, and broadcasts it to Bitcoin Cash network.

---

# Declarative Programming

Datacash lets you build a transaction in a declarative manner. Here's an example:

```
var config = {
  data: ["0x6d02", "hello from datacash"],
  cash: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    rpc: "https://cashexplorer.bitcoin.com",
    fee: 250,
    to: [{
      address: "1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81",
      value: 1000
    }]
  }
}
```

Above config describes a transaction that:

- Posts `"hello from datacash"` to [memo.cash](https://memo.cash) network (See the protocol at [https://memo.cash/protocol](https://memo.cash/protocol)),
- paying the fee of `250` satoshis,
- signed with a private key: `5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw`,
- through a public JSON-RPC endpoint at [https://cashexplorer.bitcoin.com](https://cashexplorer.bitcoin.com)
- while tipping the user `1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81` a value of `1000` satoshis.

All you need to do to invoke it is call:

```
datacash.send(config)
```

Want to instead build a transaction but save it for later or export it? Just call:

```
datacash.build(config, function(error, tx) {
  console.log("Here's the transaction! : ", tx)
})
```

And that's it! No complex APIs, but you can construct pretty much all kinds of OP_RETURN transactions.

---

# How it works

`datacash` is powered by [bitcoincash.js](https://github.com/bitcoincashjs/bitcoincashjs), which in turn is a fork of [bitcore-lib](https://github.com/bitpay/bitcore-lib), which means all the low level transactions are completely robust and secure.

`datacash` was created in order to make it dead simple to construct `OP_RETURN` related transactions, but you can even use it to build regular transactions.

Also `datacash` exposes `datacash.bch` endpoint which you can use to access the underlying `bitcoincash.js` library. If you need more sophisticated features (in most cases you won't), feel free to use this feature. Best of both worlds!

---

# API

Datacash is designed with a different philosophy than conventional Bitcoin transaction libraries.

While **traditional Bitcoin libraries focus on sending money**, datacash is focused on **sending data**.

The API is optimized to make this as simple as possible. Datacash library has only two methods:

1. `build`: For building a transaction (but not sending)
2. `send`: For sending a transaction

## 1. build

"build" builds a transaction but doesn't broadcast it to the network.

The `build()` method takes two arguments:

1. A JSON object describing the type of transaction
2. **A callback function that will be called after building the transaction:** The callback function has two arguments. The first is an error object if something fails. The second is the constructed transaction.

The first argument--a declarative JSON object--can contain the following attributes:

- `data`: For constructing `OP_RETURN` data
- `cash`: For describing everything related to actually sending money
- `tx`: For importing previously "built" transactions


### A. data

The `data` attribute is used to construct human readable/processable data to post to the blockchain.


#### 1. Buid from push data array


```
const tx = {
  data: ["0x6d02", "hello world"]
}
datacash.build(tx, function(err, tx) {  
  /**
  * res contains the generated transaction object, powered by bitcoincash.js
  * You can check it out at https://github.com/bitcoincashjs/bitcoincashjs/blob/master/src/transaction/transaction.js
  * Some available methods you can call on the tx object are:
  * 1. tx.toString() => Export as string
  * 2. tx.toObject() => Inspect the transaction as JSON object
  **/
});
```

**NOTE:** Each item in the `data` array can either be:

1. a regular string
2. a hex string

**To use hex string, simply prefix the string with "0x"**. 

In above example, we can see that the first item is `"0x6d02"`. Datacash will automatically recognize this as a hex string and interpret as a hex string (while discarding the 0x prefix before the interpretation)


#### 2. Build from hex string representing the script

This is useful if you want to export a transaction and later recover it.

```
const tx = {
  data: "6a04366430320b68656c6c6f20776f726c64"
}
datacash.build(tx, function(err, tx) {
  /**
  * res contains the generated transaction object, powered by bitcoincash.js
  * You can check it out at https://github.com/bitcoincashjs/bitcoincashjs/blob/master/src/transaction/transaction.js
  * Some available methods you can call on the tx object are:
  * 1. tx.toString() => Export as string
  * 2. tx.toObject() => Inspect the transaction as JSON object
  **/
});
```

---

### B. cash

The `cash` attribute deals with everything related to actually sending money.

- `key`: Signing with private key
- `rpc`: Specifying a JSON-RPC endpoint to broadcast through
- `fee`: Specifying transaction fee
- `to`: Attaching tips on top of OP_RETURN messages (Normally OP_RETURN transactions don't have a receiver)

When a `cash` attribute is present, the `build()` call generates a `transaction` instead of a `script`.

#### 1. `key`

The `key` attribute is mandatory. You must specify a private key in order to sign a transaction.

```
const tx = {
  data: ["6d02", "hello world"],
  cash: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" }
}
datacash.build(tx, function(err, tx) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```


#### 2. `rpc`

The `rpc` attribute is used to manually set the JSON-RPC endpoint you wish to broadcast through. 

- default: `https://cashexplorer.bitcoin.com`

```
const tx = {
  data: ["6d02", "hello world"],
  cash: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    rpc: "https://cashexplorer.bitcoin.com"
  }
};
datacash.build(tx, function(err, res) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```

#### 3. `fee`

The `fee` attribute is used to specify the transaction fee in **satoshis**.

- default: `300`

```
const tx = {
  data: ["6d02", "hello world"],
  cash: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    rpc: "https://cashexplorer.bitcoin.com",
    fee: 250
  }
}
datacash.build(tx, function(err, res) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included)
  **/
})
```

#### 4. `to`

The `to` attribute is an array of receivers to send the OP_RETURN to. Normally this is left empty because most `OP_RETURN` transactions are meant to have no receivers. But you can also send it to multiple users. For example you can use this feature to send tips to one or more people.

- default: `null`
- Each item in the `to` array can have 2 attributes:
  - address: Bitcoin cash address string
  - value: number (in satoshi)

```
const tx = {
  data: ["6d02", "hello world"],
  cash: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw",
    to: [{
      address: "1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81",
      value: 500
    }, {
      address: "1A2JN4JAUoKCQ5kA4pHhu4qCqma8jZSU81",
      value: 500
    }]
  }
};
datacash.build(tx, function(err, res) {
  /**
  * res contains the generated transaction object
  * (a signed transaction, since 'key' is included.
  * Also, the transaction includes actual coin transfer outputs,
  * since the "to" attribute is included)
  **/
})
```

---

### C. tx

You may want to import a previously exported transaction. This is when you use the `tx` attribute.

#### 1. Importing a transaction from exported hex string

```
datacash.build({
  tx: "01000000014182e9844c2979d973d3e82c55d57e1a971ed2e5473557ce0414864612911aa5010000006b48304502210098f8f32cd532bc73eef1e01c3d359caf0a7aa8f3dc1eebb8011d80810c9dbe66022054c6b23d5bd9573a1e6135c39dcc31a65cab91f3b3db781995e824614e24bad9412102d024c1861ccc655ce3395bc4d8a0bdcfb929ffcd9d1a8c81d8c6fa1dfb9bd70cffffffff020000000000000000106a026d020b68656c6c6f20776f726c64c2ff0000000000001976a9142a3a6886d98776d0197611e5328ba8806c3739db88ac00000000"
}, function(err, tx) {
  // 'tx' is a transaction object
})
```

#### 2. Importing an unsigned transaction and building a signed transaction

You can export an unsigned transaction, and later import and sign it to create a signed transaction, simply by supporting a `cash.key` attribute.

```
// import an unsigned transaction and sign it
datacash.build({
  tx: "01000000014182e9844c2979d973d3e82c55d57e1a971ed2e5473557ce0414864612911aa5010000006b48304502210098f8f32cd532bc73eef1e01c3d359caf0a7aa8f3dc1eebb8011d80810c9dbe66022054c6b23d5bd9573a1e6135c39dcc31a65cab91f3b3db781995e824614e24bad9412102d024c1861ccc655ce3395bc4d8a0bdcfb929ffcd9d1a8c81d8c6fa1dfb9bd70cffffffff020000000000000000106a026d020b68656c6c6f20776f726c64c2ff0000000000001976a9142a3a6886d98776d0197611e5328ba8806c3739db88ac00000000",
  cash: {
    key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw"
  }
}, function(err, tx) {
  // 'tx' is a signed transaction object
})
```

Notice how in addition to the `tx` attribute we've added the `cash.key` attribute. This will import the unsigned transaction and sign it.


#### 3. Importing and sending a signed transaction from exported hex string

If you already have a signed transaction object, you can simply send it away without any additional steps.

```
datacash.send({
  tx: "01000000014182e9844c2979d973d3e82c55d57e1a971ed2e5473557ce0414864612911aa5010000006b48304502210098f8f32cd532bc73eef1e01c3d359caf0a7aa8f3dc1eebb8011d80810c9dbe66022054c6b23d5bd9573a1e6135c39dcc31a65cab91f3b3db781995e824614e24bad9412102d024c1861ccc655ce3395bc4d8a0bdcfb929ffcd9d1a8c81d8c6fa1dfb9bd70cffffffff020000000000000000106a026d020b68656c6c6f20776f726c64c2ff0000000000001976a9142a3a6886d98776d0197611e5328ba8806c3739db88ac00000000"
}, function(err, hash) {
  // 'hash' is the transaction hash
})
```

---

## 2. send

Instead of just building, you can build AND send. Same syntax as `build()`.

The only difference is the callback function.

- build() returns a constructed transaction object through the callback
- send() returns a transaction hash (since it's already been sent)

### A. Sending from data and cash

```
const tx = {
  data: ["6d02", "hello world"])
  cash: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" }
}
datacash.send(tx, function(err, res) {
  console.log(res)
})
```

### B. Building an UNSIGNED transaction and exporting, and then later importing and sending the transaction in separate steps

```
// Build and export an unsigned transaction for later usage
var exportedTxHex = "";
const tx = {
  data: ["6d02", "hello world"]
}
datacash.build(tx, function(err, res) {
  exportedTxHex = res;
})

// Later import exportedTxHex and sign it with privatkey, and broadcast, all in one method:
datacash.send({
  tx: exportedTx,
  cash: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" }
}, function(err, hash) {
  // hash contains the transaction hash after the broadcast
})
```

### C. Building a SIGNED transaction and exporting, and then later importing and sending

This time since the exported transaction is already signed, no need for additional `cash.key` attriute when sending later


```
// Build and export an unsigned transaction for later usage
var exportedSignedTxHex = "";
const tx = {
  data: ["6d02", "hello world"],
  cash: { key: "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw" }
}
datacash.build(tx, function(err, res) {
  exportedSignedTxHex = res;
})

// Later import exportedTxHex and broadcast, all in one method:
datacash.send({
  tx: exportedSignedTx,
}, function(err, hash) {
  // hash contains the transaction hash after the broadcast
})
```

---

# Advanced

Datacash depends on two powerful libraries for low level stuff.

1. bitcoincash.js: https://bitcoincashjs.github.io/
2. bitcore-explorers: https://github.com/bitpay/bitcore-explorers

While Datacash is designed to be the simplest possible way to write data to the blockchain, you may want to sometimes access the low level libraries that power datacash.

Datacash exposes additional endpoints so you can simply access these libraries without having to install or include any additional libraries.

## 1. datacash.bch

This endpoint exposes the [bitcoincash.js](https://bitcoincashjs.github.io) library object. Basically by referncing `bch` you have access to the entire bitcoincash.js library.

```
const privateKey = new datacash.bch.PrivateKey();
const address = privateKey.toAddress();
console.log(address.toString()) // 15WZwpw3BofscM2u43ji85BXucai5YGToL
```

## 2. datacash.connect

This endpoint is used to access the [bitcore-explorers](https://github.com/bitpay/bitcore-explorers) library.

Using this endpoint you can connect to a public JSON-RPC endpoint to let you make various direct JSON-RPC function calls such as `getUnspentUtxos`, etc. (Basically it instantiates and returns the `insight` object from https://github.com/bitpay/bitcore-explorers)

### Syntax

```
datacash.connect([RPC ENDPOINT]).[METHOD]
```

If you leave the `RPC ENDPOINT` part out, it will automatically use the default https://cashexplorer.bitcoin.com node

### Example 1: Connecting to default node and calling `getUnspentUtxos()` method:

```
datacash.connect().getUnspentUtxos("14xMz8rKm4L83RuZdmsHXD2jvENZbv72vR", function(err, utxos) {
  if (err) {
    console.log("Error: ", err)
  } else {
    console.log(utxos) 
  }
})
```

### Example 2. Specifying a JSON-RPC endpoint

```
datacash.connect('https://cashexplorer.bitcoin.com').getUnspentUtxos("14xMz8rKm4L83RuZdmsHXD2jvENZbv72vR", function(err, utxos) {
  if (err) {
    console.log("Error: ", err)
  } else {
    console.log(utxos) 
  }
});
```
