class UserAccount{
    private String accountnumber;
    private double amount;

    public UserAccount(String accountnumber, double amount){
        System.out.println("Generate the account number ");
        this.accountnumber = accountnumber;
        this.amount = amount;
    }
    public double getamount(){
        return this.amount;
    }
    public void setamount(double newamount){
        this.amount=newamount;
    }
};

class transfermoney{
    public void transfer(UserAccount from, UserAccount to, double amount){
        if(from.getamount()>=amount){
            from.setamount(from.getamount()-amount);
            to.setamount(to.getamount()+amount);
            System.out.println("Transfer successful");
        }
        else{
            System.out.println("Insufficient funds");
        }
    }
};

class Depositemoney{
    public void deposit(UserAccount account, double amount){
        account.setamount(account.getamount()+amount);
        System.out.println("Deposit successful");
    }
};

class Withdrawmoney{
    public void withdraw(UserAccount account, double amount){
        if(account.getamount()>=amount){
            account.setamount(account.getamount()-amount);
            System.out.println("Withdrawal successful");
        }
        else{
            System.out.println("Insufficient funds");
        }
    }
};

public class question2 {
    public static void main(String[] args) {
        UserAccount user1= new UserAccount("A1", 10000);
        UserAccount user2= new UserAccount("A2", 11000);

        transfermoney trans=new transfermoney();
        Depositemoney dep= new Depositemoney();
        Withdrawmoney with =new Withdrawmoney();

        dep.deposit(user1, 2000);
        with.withdraw(user2, 3000);
        trans.transfer(user1, user2, 4000);

        System.out.println(user1.getamount());
        System.out.println(user2.getamount());
    }
}
