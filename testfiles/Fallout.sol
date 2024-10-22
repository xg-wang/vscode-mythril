pragma solidity ^0.4.18;

import './Ownable.sol';

contract Fallout is Ownable {

  mapping (address => uint) allocations;

  /* constructor */
  function Fallout() payable {
    owner = msg.sender;
    allocations[owner] = msg.value;
  }

  function allocate() public payable {
    allocations[msg.sender] += msg.value;
  }

  function sendAllocation(address allocator) public {
    require(allocations[allocator] > 0);
    allocator.transfer(allocations[allocator]);
  }

  function collectAllocations() public onlyOwner {
    msg.sender.transfer(this.balance);
  }

  function allocatorBalance(address allocator) public constant returns (uint) {
    return allocations[allocator];
  }
}