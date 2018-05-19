const assert = require('assert');
const bch = require('bitcoincashjs');
const datacash = require('../index');

// Private Key for Demo Purpose Only
const privKey = "5JZ4RXH4MoXpaUQMcJHo8DxhZtkf5U5VnYd9zZH8BRKZuAbxZEw"

describe('datacash', function() {
  describe('build', function() {
    describe('data only', function() {
      it('push data array', function(done) {
        const options = {
          data: ["0x6d02", "hello world"]
        }
        datacash.build(options, function(err, tx) {
          let generated = tx.toObject();
          // no input (since no one has signed yet)
          assert.equal(generated.inputs.length, 0)
          // output has one item (only OP_RETURN)
          assert.equal(generated.outputs.length, 1)
          // the only existing output is a script
          assert(generated.outputs[0].script);
          // uses the default fee of 400
          assert.equal(generated.fee, 400)

          done()
        });
      })
      it('hex string that represents script', function(done) {
        const options = {
          data: "6a04366430320b68656c6c6f20776f726c64"
        }
        datacash.build(options, function(err, tx) {
          let generated = tx.toObject();
          // no input (since no one has signed yet)
          assert.equal(generated.inputs.length, 0)
          // output has one item (only OP_RETURN)
          assert.equal(generated.outputs.length, 1)
          // the only existing output is a script
          assert(generated.outputs[0].script);
          // uses the default fee of 400
          assert.equal(generated.fee, 400)

          done()
        });
      })
    })
    describe('cash only', function() {
      it('cash.key only', function(done) {
        const options = {
          cash: {
            key: privKey
          }
        }
        datacash.build(options, function(err, tx) {
          // If only 'key' is included, it will use the default values for
          // rest of the cash attributes
          // and make a transaction that sends money to oneself
          // (since no receiver is specified)
          let generated = tx.toObject();

          // input length 1 => from the user specifiec by the private key
          assert.equal(generated.inputs.length, 1)
          // uses the default fee of 400
          assert.equal(generated.fee, 400)
          // contains a 'changeScript'
          assert(generated.changeScript)

          // output length 1 => the output points to the sender by default
          assert.equal(generated.outputs.length, 1)
          // script is a pubkeyhashout
          let s = new bch.Script(generated.outputs[0].script)
          assert(s.isPublicKeyHashOut())

          // script sends the money to the same address as the sender
          // specified by the private key
          const address = new bch.PrivateKey(privKey).toAddress()
          assert.equal(address.toString(), s.toAddress().toString())

          done()
        });
      })
      it('cash.fee only', function(done) {
        const options = {
          cash: {
            fee: 100
          }
        }
        datacash.build(options, function(err, tx) {
          // if no key is included,
          // empty input (since no sender)
          // empty output (since nothing else is specified)
          let generated = tx.toObject();
          assert.equal(generated.inputs.length, 0)
          assert.equal(generated.outputs.length, 0)
          assert.equal(generated.fee, 100)
          done()
        })
      })
      it('cash.key and cash.fee', function(done) {
        const options = {
          cash: {
            key: privKey,
            fee: 100
          }
        }
        datacash.build(options, function(err, tx) {
          let generated = tx.toObject();
          assert.equal(generated.fee, 100)
          done()
        })
      })

      /**

        cash.rpc TBD

      **/

    })
    describe('data and cash', function() {
      it('both data and cash', function(done) {
        const options = {
          data: ["0x6d02", "hello world"],
          cash: {
            key: privKey
          }
        }
        datacash.build(options, function(err, tx) {
          let generated = tx.toObject();

          // input length 1 => from the user specifiec by the private key
          assert.equal(generated.inputs.length, 1)
          // contains a 'changeScript'
          assert(generated.changeScript)

          // must have two outputs
          assert.equal(generated.outputs.length, 2)

          let s1 = new bch.Script(generated.outputs[0].script)

          // the first output is OP_RETURN
          assert(s1.chunks[0].opcodenum, bch.Opcode.OP_RETURN)

          // the second script is a pubkeyhashout (change address)
          let s2 = new bch.Script(generated.outputs[1].script)
          assert(s2.isPublicKeyHashOut())

          // script sends the money to the same address as the sender
          // specified by the private key
          const address = new bch.PrivateKey(privKey).toAddress()
          assert.equal(address.toString(), s2.toAddress().toString())

          done()
        })
      })
    })
    describe('attach coins to data', function() {
      it('paying tip to 1 user', function(done) {
        // send to myself
        const receiver = new bch.PrivateKey(privKey).toAddress()

        const options = {
          data: ["0x6d02", "hello world"],
          cash: {
            key: privKey,
            to: [{
              address: receiver,
              value: 1000
            }]
          }
        }
        datacash.build(options, function(err, tx) {
          // output has 3 items
          assert.equal(tx.outputs.length, 3)

          // 1. OP_RETURN
          let s1 = new bch.Script(tx.outputs[0].script)
          assert(s1.chunks[0].opcodenum, bch.Opcode.OP_RETURN)
          // 2. Manual transaction output
          // the second script is a pubkeyhashout (change address)
          let s2 = new bch.Script(tx.outputs[1].script)
          assert(s2.isPublicKeyHashOut())
          // the value sent is 1000
          assert.equal(tx.outputs[1].satoshis, 1000)
          // the receiver address is the address specified in cash.to
          assert.equal(s2.toAddress().toString(), bch.Address(receiver).toString())

          // 3. Change address transaction output
          let s3 = new bch.Script(tx.outputs[2].script)
          assert(s3.isPublicKeyHashOut())
          done()
        })
      })
      it('paying tip to 2 users', function(done) {
        // send to myself
        const receiver = new bch.PrivateKey(privKey).toAddress()

        const options = {
          data: ["0x6d02", "hello world"],
          cash: {
            key: privKey,
            to: [{
              address: receiver,
              value: 1000
            }, {
              address: receiver,
              value: 2000
            }]
          }
        }
        datacash.build(options, function(err, tx) {
          // output has 4 items
          assert.equal(tx.outputs.length, 4)

          // 1. OP_RETURN
          let s1 = new bch.Script(tx.outputs[0].script)
          assert(s1.chunks[0].opcodenum, bch.Opcode.OP_RETURN)
          // 2. Manual transaction output
          // the second script is a pubkeyhashout (change address)
          let s2 = new bch.Script(tx.outputs[1].script)
          assert(s2.isPublicKeyHashOut())
          // the value sent is 1000
          assert.equal(tx.outputs[1].satoshis, 1000)
          // the receiver address is the address specified in cash.to
          assert.equal(s2.toAddress().toString(), bch.Address(receiver).toString())

          // 3. Manual transaction output
          // the third script is a pubkeyhashout (change address)
          let s3 = new bch.Script(tx.outputs[2].script)
          assert(s3.isPublicKeyHashOut())
          // the value sent is 1000
          assert.equal(tx.outputs[2].satoshis, 2000)
          // the receiver address is the address specified in cash.to
          assert.equal(s3.toAddress().toString(), bch.Address(receiver).toString())

          // 3. Change address transaction output
          let s4 = new bch.Script(tx.outputs[3].script)
          assert(s4.isPublicKeyHashOut())
          done()
        })
      })
    })
    describe('tx', function() {
      describe('importing unsigned tx', function() {
        it('tx only', function(done) {
          // 1. build
          const options = {
            data: ["0x6d02", "hello world"]
          }
          datacash.build(options, function(err, original_tx) {
            // 2. export
            let exportedTx = original_tx.toString()
            // exported transaction is string
            assert.equal(typeof exportedTx, "string")
            // 3. re-import
            datacash.build({
              tx: exportedTx
            }, function(err, imported_tx) {
              // the imported transaction should equal the original transaction
              assert.equal(imported_tx.toString(), original_tx.toString())
              done()
            })
          })
        })
        it('tx + data', function(done) {
          // if there's a 'tx' attribute, it should ignore 'data' to avoid confusion
          const options1 = {
            data: ["0x6d02", "hello world"]
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. build a new transaction using the exported transaction + new data
            let options2 = {
              tx: exported_tx1,
              data: ["0x6d02", "bye world"]
            }
            datacash.build(options2, function(err, tx2) {
              assert.equal(tx1.toString(), tx2.toString())
              done()
            })
          })
        })
        it('tx + cash', function(done) {
          // tx1 is an unsigned transaction
          // and we create a signed version by adding the 'cash' attribute
          const options1 = {
            data: ["0x6d02", "hello world"]
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. build a new transaction using the exported transaction + new data
            let options2 = {
              tx: exported_tx1,
              cash: {
                key: privKey
              }
            }
            datacash.build(options2, function(err, tx2) {

              // tx1's input should be empty
              assert.equal(tx1.inputs.length, 0)
              // tx2's input should now have one item
              assert.equal(tx2.inputs.length, 1)

              // tx1's output should have one item
              assert.equal(tx1.outputs.length, 1)
              // and it should be an OP_RETURN
              let script1 = new bch.Script(tx1.outputs[0].script)
              assert(script1.chunks[0].opcodenum, bch.Opcode.OP_RETURN)

              // tx2's output should have two items
              assert.equal(tx2.outputs.length, 2)
              let script2 = [
                new bch.Script(tx2.outputs[0].script),
                new bch.Script(tx2.outputs[1].script)
              ]
              // the first should be OP_RETURN
              assert(script2[0].chunks[0].opcodenum, bch.Opcode.OP_RETURN)
              // the second script is a pubkeyhashout (change address)
              assert(script2[1].isPublicKeyHashOut())
              done()
            })
          })
        })
        it('tx + cash + data', function(done) {
          // tx1 is an unsigned transaction
          // and we create a signed version by adding the 'cash' attribute
          // but this time we also try to sneak in 'data'
          // the 'data' should be ignored
          const options1 = {
            data: ["0x6d02", "hello world"]
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. build a new transaction using the exported transaction + new data
            let options2 = {
              tx: exported_tx1,
              data: ["0x6d02", "bye world"],  // trying to sneak in 'data'
              cash: {
                key: privKey
              }
            }
            datacash.build(options2, function(err, tx2) {

              // tx2's input should now have one item
              assert.equal(tx2.inputs.length, 1)

              // tx2's output should have two items
              assert.equal(tx2.outputs.length, 2)
              let script2 = [
                new bch.Script(tx2.outputs[0].script),
                new bch.Script(tx2.outputs[1].script)
              ]
              // the first should be OP_RETURN
              assert(script2[0].chunks[0].opcodenum, bch.Opcode.OP_RETURN)
              // the second script is a pubkeyhashout (change address)
              assert(script2[1].isPublicKeyHashOut())

              // the script for the original OP_RETURN
              // should match the new OP_RETURN script
              // because the 'data' attribute was ignored
              let script1 = new bch.Script(tx1.outputs[0].script)
              assert.equal(script1.toString(), script2[0].toString())
              done()
            })
          })
        })
      })
      describe('importing signed tx', function() {
        it('tx only', function(done) {
          const options1 = {
            data: ["0x6d02", "hello world"],
            cash: { key: privKey }
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. import transaction
            datacash.build({ tx: exported_tx1 }, function(err, tx2) {
              // the imported transaction should have one input
              assert.equal(tx2.inputs.length, 1)
              // the input should have 'script' property
              assert(tx2.inputs[0].script)
              // the script should be public key hash in
              let script = new bch.Script(tx2.inputs[0].script)
              assert(script.isPublicKeyHashIn())
              // the imported transaction's input script address should match
              // the address corresponding to the originally imported private key
              const address = new bch.PrivateKey(privKey).toAddress()
              assert.equal(address.toString(), script.toAddress().toString())
              done()
            })
          })
        })
        it('tx + data', function(done) {
          // the transaction has already been signed
          // the data should be ignored
          // Better yet, this shouldn't be used
          const options1 = {
            data: ["0x6d02", "hello world"],
            cash: { key: privKey }
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. import transaction
            datacash.build({
              tx: exported_tx1,
              data: ["0x6d02", "bye world"]
            }, function(err, tx2) {
              assert(err.toString(), "the transaction is already signed and cannot be modified")
              assert.equal(tx2, undefined)
              done()
            })
          })
        })
        it('tx+ cash', function() {
          // the transaction has already been signed
          // the cash attribute should be ignored
          // and throw and error
          const options1 = {
            data: ["0x6d02", "hello world"],
            cash: { key: privKey }
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. import transaction
            // But this time, we're updating the key attribute.
            // This should re-sign the transaction
            datacash.build({
              tx: exported_tx1,
              cash: {
                key: privKey
              }
            }, function(err, tx2) {
              assert(err.toString(), "the transaction is already signed and cannot be modified")
              assert.equal(tx2, undefined)
              done()
            })
          })
        })
        it('tx + cash + data', function() {
          const options1 = {
            data: ["0x6d02", "hello world"],
            cash: { key: privKey }
          }
          // 1. build initial transaction
          datacash.build(options1, function(err, tx1) {
            let exported_tx1 = tx1.toString();
            // 2. import transaction
            // But this time, we're updating the key attribute.
            // This should re-sign the transaction
            datacash.build({
              tx: exported_tx1,
              data: ["0x6d02", "bye world"],
              cash: {
                key: privKey
              }
            }, function(err, tx2) {
              assert(err.toString(), "the transaction is already signed and cannot be modified")
              assert.equal(tx2, undefined)
              done()
            })
          })
        })
      })
    })
  })
  describe('advanced', function() {
    describe('bch', function() {
      it('exposes bch', function() {
        assert(datacash.bch.Networks)
        assert(datacash.bch.Opcode)
      })
    })
    describe('connect', function() {
      it('default', function() {
        var insight = datacash.connect();
        assert.equal(insight.constructor.name, "Insight")
        assert.equal(insight.url, 'https://cashexplorer.bitcoin.com')
      })
      it('connect with url', function() {
        var insight = datacash.connect('https://cashexplorer2.bitcoin.com');
        assert.equal(insight.constructor.name, "Insight")
        assert.equal(insight.url, 'https://cashexplorer2.bitcoin.com')
      })
    })
  })
})
