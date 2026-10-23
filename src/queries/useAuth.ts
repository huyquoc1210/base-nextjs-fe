import authApi from "@/apis/auth";
import { useMutation } from "@tanstack/react-query";

export const useLoginMutation = () =>
  useMutation({ mutationFn: authApi.login });

export const useLogoutMutation = () =>
  useMutation({ mutationFn: authApi.logout });
