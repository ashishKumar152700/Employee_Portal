import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the stack parameter list
export type RootStackParamList = {
  LoginScreen: undefined;
  Main: undefined;
  leaveHistory:undefined;
  loanHistory:undefined;
  salaryAdHistory:undefined;
  reimburseHistory:undefined;
  Login:undefined;
  MyLeaveScreen:undefined
};

// Type for navigation prop
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LoginScreen'>;

// Type for route prop (if passing parameters, otherwise can be ignored)
export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'LoginScreen'>;
