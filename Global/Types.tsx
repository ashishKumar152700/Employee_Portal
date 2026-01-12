import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp  } from '@react-navigation/native-stack';

// Define the stack parameter list
export type RootStackParamList = {
  LoginScreen: undefined;
  Main: undefined;
  leaveHistory:undefined;
  loanHistory:undefined;
  salaryAdHistory:undefined;
  reimburseHistory:undefined;
  overtimeHistory:undefined;
  addMemberHistory : undefined;
  resignHistory:undefined;
  Login:undefined;
  MyLeaveScreen:undefined
};

// Type for navigation prop
export type LoginScreenNavigationProp = NativeStackNavigationProp <RootStackParamList, 'LoginScreen'>;

// Type for route prop (if passing parameters, otherwise can be ignored)
export type LoginScreenRouteProp = RouteProp<RootStackParamList, 'LoginScreen'>;
