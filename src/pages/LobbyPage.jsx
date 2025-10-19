import { useEffect } from "react"; // 1. useEffect import 추가
import { Container, Typography, Box, Button, Link, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { styled } from '@mui/material/styles';
import { useRoomStore } from "../store/roomStore"; // 2. useRoomStore import 추가

const Root = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: theme.palette.background.default,
}));

const ContentWrapper = styled(Container)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(4),
}));

const Title = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: '600px',
  margin: '0 auto',
  marginBottom: theme.spacing(4),
}));

const ButtonGroup = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const LinkGroup = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const LobbyPage = () => {
  const navigate = useNavigate();
  const resetRoomState = useRoomStore((state) => state.resetRoomState); // 3. reset 함수 가져오기

  // ✅ 4. useEffect 훅 추가
  // 이 페이지가 로드될 때마다 이전 방 정보를 초기화합니다.
  useEffect(() => {
    resetRoomState();
  }, [resetRoomState]);

  return (
    <Root>
      <ContentWrapper maxWidth="lg">
        <Box>
          <Title variant="h1" gutterBottom>
            Pick Master
          </Title>
          <Subtitle variant="h6">
            실제 LoL 대회와 같은 밴픽 경험을 친구들과 무료로 즐겨보세요!
          </Subtitle>
        </Box>

        <ButtonGroup direction="row" spacing={3} justifyContent="center">
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate("/mode-select")}
          >
            새 게임 생성
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            size="large"
            onClick={() => {
              const roomId = prompt("참여할 방의 ID를 입력하세요:");
              if (roomId) {
                navigate(`/room/${roomId}`);
              }
            }}
            disabled
          >
            참가
          </Button>
        </ButtonGroup>

        <LinkGroup direction="row" spacing={3} justifyContent="center">
          <Link href="https://www.leagueoflegends.com/ko-kr/news/tags/patch-notes/" target="_blank" rel="noopener">
            최신 패치 노트
          </Link>
          <Link href="https://lol.ps/" target="_blank" rel="noopener">
            lol.ps
          </Link>
          <Link href="https://github.com/cookiboii" target="_blank" rel="noopener">
            개발자 GitHub
          </Link>
        </LinkGroup>
        <Link href="https://open.kakao.com/o/sZVtfOXh" target="_blank" rel="noopener">
          문의 및  협업 환영
        </Link>
      </ContentWrapper>
    </Root>
  );
};

export default LobbyPage;